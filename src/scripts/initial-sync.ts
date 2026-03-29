/**
 * One-time initial bulk sync: Users → Products → Orders (sequential, no queue).
 * Run with: npm run start:initial
 * After this completes, use npm start for ongoing sync via BullMQ workers.
 */
import { prismaClient } from "../db/prisma.ts";
import {
    syncLedgerBatch,
    syncStockItemBatch,
    createSalesVoucher,
    createReceiptVoucher,
    syncLedger,
} from "../integrations/tally/tally.service.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { tallyLog } from "../integrations/tally/logs/tally.logger.ts";
import { tallyConfig } from "../integrations/tally/tally.config.ts";

const TALLY_VOUCHER_DATE = "20250801";
const MASTER_BATCH = 100;   // ledgers / stock items per Tally HTTP call
const ORDER_CONCURRENCY = 20; // parallel order voucher calls per round
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 8000; // wait 8s before retrying a timed-out Tally call

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const withRetry = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const msg = String(err);
            const isTimeout = msg.includes("timed out") || msg.includes("ECONNREFUSED") || msg.includes("ECONNRESET");
            if (isTimeout && attempt < MAX_RETRIES) {
                tallyLog.info("InitialSync", "-", label, `Tally timeout — retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt}/${MAX_RETRIES})`);
                await sleep(RETRY_DELAY_MS);
                continue;
            }
            throw err;
        }
    }
    throw new Error(`${label} failed after ${MAX_RETRIES} attempts`);
};

const PENDING_USER    = [TALLY_STATUS.USER_NEW,    TALLY_STATUS.USER_UPDATED];
const PENDING_PRODUCT = [TALLY_STATUS.PRODUCT_NEW, TALLY_STATUS.PRODUCT_UPDATED];
const PENDING_ORDER   = [TALLY_STATUS.ORDER_NEW,   TALLY_STATUS.ORDER_UPDATED];

// ── Phase 0: System ledgers (Sales + Bank) ────────────────────────────────────
async function ensureSystemLedgers() {
    tallyLog.info("InitialSync", "-", "setup", "Phase 0 — ensuring Sales and Bank ledgers exist in Tally...");

    const ledgers = [
        { name: tallyConfig.salesLedger, group: "Sales Accounts" },
        { name: tallyConfig.bankLedger,  group: "Bank Accounts"  },
    ];

    for (const { name, group } of ledgers) {
        // Try Create first; if it already exists Tally will return IGNORED or LINEERROR — that's fine
        const result = await withRetry(`setup-${name}`, () =>
            syncLedger({ name, group, action: "Create" })
        );
        if (result.success) {
            tallyLog.success("InitialSync", "-", "setup", `Ledger "${name}" ready`);
        } else {
            // Already exists → try Alter (no-op update) just to confirm it's accessible
            const alter = await withRetry(`setup-alter-${name}`, () =>
                syncLedger({ name, group, action: "Alter" })
            );
            if (alter.success) {
                tallyLog.info("InitialSync", "-", "setup", `Ledger "${name}" already exists — OK`);
            } else {
                throw new Error(`Cannot create or access ledger "${name}" in Tally. Check the ledger name and group in your .env (TALLY_SALES_LEDGER / TALLY_BANK_LEDGER). Raw: ${alter.rawXml}`);
            }
        }
    }

    tallyLog.success("InitialSync", "-", "setup", "Phase 0 complete — system ledgers ready");
}

// ── Phase 1: Users ────────────────────────────────────────────────────────────
async function syncUsers() {
    tallyLog.info("InitialSync", "-", "users", "Phase 1 — syncing all users...");
    let total = 0;

    while (true) {
        const users = await prismaClient.user.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_USER } }, { tallyStatus: null }] },
            select: { id: true, name: true, email: true, tallyStatus: true },
            take: MASTER_BATCH,
        });
        if (users.length === 0) break;

        const creates = users.filter((u) => u.tallyStatus !== TALLY_STATUS.USER_UPDATED);
        const alters  = users.filter((u) => u.tallyStatus === TALLY_STATUS.USER_UPDATED);

        for (const [action, batch] of [["Create", creates], ["Alter", alters]] as [string, typeof users][]) {
            if (batch.length === 0) continue;
            const result = await withRetry("users", () =>
                syncLedgerBatch(batch.map((u) => ({ name: u.name, email: u.email, action: action as "Create" | "Alter" })))
            );
            if (!result.success) {
                tallyLog.error("InitialSync", "-", `users-${action}`, result.message ?? "Failed", result.rawXml);
                throw new Error(`User ${action} batch failed: ${result.message}`);
            }
            await prismaClient.user.updateMany({
                where: { id: { in: batch.map((u) => u.id) } },
                data: { tallyStatus: TALLY_STATUS.USER_SYNCED, lastTallySyncAt: new Date() },
            });
            total += batch.length;
        }

        tallyLog.info("InitialSync", "-", "users", `${total} synced so far...`);
    }

    tallyLog.success("InitialSync", "-", "users", `Phase 1 complete — ${total} users synced to Tally`);
}

// ── Phase 2: Products ─────────────────────────────────────────────────────────
async function syncProducts() {
    tallyLog.info("InitialSync", "-", "products", "Phase 2 — syncing all products...");
    let total = 0;

    while (true) {
        const products = await prismaClient.product.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_PRODUCT } }, { tallyStatus: null }] },
            select: { id: true, name: true, tallyStatus: true },
            take: MASTER_BATCH,
        });
        if (products.length === 0) break;

        const creates = products.filter((p) => p.tallyStatus !== TALLY_STATUS.PRODUCT_UPDATED);
        const alters  = products.filter((p) => p.tallyStatus === TALLY_STATUS.PRODUCT_UPDATED);

        for (const [action, batch] of [["Create", creates], ["Alter", alters]] as [string, typeof products][]) {
            if (batch.length === 0) continue;
            const result = await withRetry("products", () =>
                syncStockItemBatch(batch.map((p) => ({ name: p.name, action: action as "Create" | "Alter" })))
            );
            if (!result.success) {
                tallyLog.error("InitialSync", "-", `products-${action}`, result.message ?? "Failed", result.rawXml);
                throw new Error(`Product ${action} batch failed: ${result.message}`);
            }
            await prismaClient.product.updateMany({
                where: { id: { in: batch.map((p) => p.id) } },
                data: { tallyStatus: TALLY_STATUS.PRODUCT_SYNCED, lastTallySyncAt: new Date() },
            });
            total += batch.length;
        }

        tallyLog.info("InitialSync", "-", "products", `${total} synced so far...`);
    }

    tallyLog.success("InitialSync", "-", "products", `Phase 2 complete — ${total} products synced to Tally`);
}

// ── Phase 3: Orders ───────────────────────────────────────────────────────────
async function syncOrders() {
    tallyLog.info("InitialSync", "-", "orders", "Phase 3 — syncing all orders...");
    let total = 0;
    let loggedFirst = false;

    while (true) {
        // Users + products are all synced now — no dependency checks needed
        const orders = await prismaClient.order.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_ORDER } }, { tallyStatus: null }] },
            include: {
                user: true,
                products: { include: { product: true } },
            },
            take: ORDER_CONCURRENCY,
        });
        if (orders.length === 0) break;

        await Promise.all(orders.map(async (order) => {
            const payload = {
                orderId: order.id,
                date: TALLY_VOUCHER_DATE,
                partyName: order.user.name,
                address: order.address,
                items: order.products.map((op) => ({
                    productName: op.product.name,
                    quantity: op.quantity,
                    rate: Number(op.product.price),
                    amount: op.quantity * Number(op.product.price),
                })),
                totalAmount: Number(order.netAmount),
            };

            // Log the first order's payload so we can inspect it
            if (!loggedFirst) {
                loggedFirst = true;
                tallyLog.info("InitialSync", order.id, "sales-voucher-payload", JSON.stringify(payload, null, 2));
            }

            const salesResult = await withRetry(`order-${order.id}-sales`, () => createSalesVoucher(payload));

            // Always log Tally's full response for the first 5 orders
            if (total < 5) {
                tallyLog.info("InitialSync", order.id, "sales-voucher-response", salesResult.rawXml ?? "(empty)");
            }

            if (!salesResult.success) {
                tallyLog.error("InitialSync", order.id, "sales-voucher", salesResult.message ?? "Failed", salesResult.rawXml);
                throw new Error(`Order ${order.id} sales voucher failed: ${salesResult.message}`);
            }

            tallyLog.success("InitialSync", order.id, "sales-voucher", `created | response: ${(salesResult.rawXml ?? "").replace(/\s+/g, " ").slice(0, 200)}`);

            if (order.paymentId) {
                const receiptResult = await withRetry(`order-${order.id}-receipt`, () => createReceiptVoucher({
                    orderId: order.id,
                    date: TALLY_VOUCHER_DATE,
                    partyName: order.user.name,
                    amount: Number(order.netAmount),
                    paymentId: order.paymentId,
                }));
                if (!receiptResult.success) {
                    tallyLog.error("InitialSync", order.id, "receipt-voucher", receiptResult.message ?? "Failed", receiptResult.rawXml);
                    throw new Error(`Order ${order.id} receipt voucher failed: ${receiptResult.message}`);
                }
                tallyLog.success("InitialSync", order.id, "receipt-voucher", "created");
            }

            await prismaClient.order.update({
                where: { id: order.id },
                data: { tallyStatus: TALLY_STATUS.ORDER_SYNCED, lastTallySyncAt: new Date() },
            });
        }));

        total += orders.length;
        tallyLog.info("InitialSync", "-", "orders", `${total} synced so far...`);
    }

    tallyLog.success("InitialSync", "-", "orders", `Phase 3 complete — ${total} orders synced to Tally`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
try {
    await ensureSystemLedgers();
    await syncUsers();
    await syncProducts();
    await syncOrders();
    tallyLog.info("InitialSync", "-", "done", "Initial sync complete. Run npm start for ongoing sync.");
} catch (err) {
    tallyLog.error("InitialSync", "-", "fatal", String(err));
    process.exit(1);
} finally {
    await prismaClient.$disconnect();
}

process.exit(0);
