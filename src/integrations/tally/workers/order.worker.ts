import { Worker, type Job } from "bullmq";
import { prismaClient } from "../../../db/prisma.ts";
import { createSalesVoucher, createReceiptVoucher } from "../tally.service.ts";
import { TALLY_STATUS } from "../tally.status.ts";
import { tallyLog } from "../logs/tally.logger.ts";
import { bullmqConnection } from "../queues/connection.ts";
import { enqueueUserSync } from "../queues/user.queue.ts";
import { enqueueProductSync } from "../queues/product.queue.ts";
import type { OrderSyncJobData } from "../queues/order.queue.ts";

const TALLY_VOUCHER_DATE = "20250801";

export const startOrderWorker = () => {
    const worker = new Worker<OrderSyncJobData>(
        "tally-orders",
        async (job: Job<OrderSyncJobData>) => {
            const { orderId } = job.data;

            const order = await prismaClient.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true,
                    products: { include: { product: true } },
                },
            });

            if (!order) {
                tallyLog.info("Order", orderId, "sync", "Order not found in DB — skipping");
                return;
            }

            tallyLog.jobStart("Order", orderId, job.id ?? "", job.attemptsMade + 1);

            // ── Dependency check: User must be synced ────────────────────────
            if (order.user.tallyStatus !== TALLY_STATUS.USER_SYNCED) {
                tallyLog.dependencyPending(orderId, "User", order.user.id);
                await enqueueUserSync(
                    order.user.id,
                    order.user.tallyStatus === TALLY_STATUS.USER_UPDATED ? "Alter" : "Create"
                );
                throw new Error("User not yet synced — retrying");
            }

            // ── Dependency check: All products must be synced ────────────────
            const unsyncedProducts = order.products.filter(
                (op) => op.product.tallyStatus !== TALLY_STATUS.PRODUCT_SYNCED
            );
            if (unsyncedProducts.length > 0) {
                unsyncedProducts.forEach(op => tallyLog.dependencyPending(orderId, "Product", op.product.id));
                await Promise.all(
                    unsyncedProducts.map((op) =>
                        enqueueProductSync(
                            op.product.id,
                            op.product.tallyStatus === TALLY_STATUS.PRODUCT_UPDATED ? "Alter" : "Create"
                        )
                    )
                );
                throw new Error("Products not yet synced — retrying");
            }

            // ── Create Sales Voucher ─────────────────────────────────────────
            const salesResult = await createSalesVoucher({
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
            });

            if (!salesResult.success) {
                tallyLog.error("Order", orderId, "sales-voucher", salesResult.message ?? "Tally returned failure", salesResult.rawXml);
                throw new Error(salesResult.message ?? "Sales voucher creation failed");
            }

            tallyLog.success("Order", orderId, "sales-voucher", "Sales voucher created successfully");

            // ── Create Receipt Voucher (only if paymentId exists) ────────────
            if (order.paymentId) {
                const receiptResult = await createReceiptVoucher({
                    orderId: order.id,
                    date: TALLY_VOUCHER_DATE,
                    partyName: order.user.name,
                    amount: Number(order.netAmount),
                    paymentId: order.paymentId,
                });

                if (!receiptResult.success) {
                    tallyLog.error("Order", orderId, "receipt-voucher", receiptResult.message ?? "Tally returned failure", receiptResult.rawXml);
                    throw new Error(receiptResult.message ?? "Receipt voucher creation failed");
                }

                tallyLog.success("Order", orderId, "receipt-voucher", "Receipt voucher created successfully");
            }

            // ── Mark synced ──────────────────────────────────────────────────
            await prismaClient.order.update({
                where: { id: orderId },
                data: { tallyStatus: TALLY_STATUS.ORDER_SYNCED, lastTallySyncAt: new Date() },
            });

            tallyLog.success("Order", orderId, "sync", "Order fully synced to Tally");
        },
        { connection: bullmqConnection, concurrency: 20 }
    );

    worker.on("failed", async (job: Job<OrderSyncJobData> | undefined, err: Error) => {
        if (!job) return;
        const maxAttempts = job.opts.attempts ?? 5;
        if (job.attemptsMade >= maxAttempts) {
            const { orderId } = job.data;
            tallyLog.jobFailed("Order", orderId, job.id ?? "", maxAttempts, err.message);
            await prismaClient.order.update({
                where: { id: orderId },
                data: { tallyStatus: TALLY_STATUS.ORDER_FAILED },
            }).catch((updateErr: Error) => tallyLog.error("Order", orderId, "sync", `Failed to update ORDER_FAILED status: ${updateErr.message}`));
        }
    });

    worker.on("error", (err: Error) => tallyLog.error("Order", "-", "worker-error", err.message));

    tallyLog.workerStart("Order", 20);
    return worker;
};
