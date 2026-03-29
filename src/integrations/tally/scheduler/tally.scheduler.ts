import { Queue, Worker } from "bullmq";
import { bullmqConnection } from "../queues/connection.ts";
import { prismaClient } from "../../../db/prisma.ts";
import { enqueueUserBatch } from "../queues/user.queue.ts";
import { enqueueProductBatch } from "../queues/product.queue.ts";
import { enqueueOrderSync } from "../queues/order.queue.ts";
import { TALLY_STATUS } from "../tally.status.ts";
import { tallyLog } from "../logs/tally.logger.ts";

const BACKFILL_QUEUE = "tally-scheduler";
const BATCH_SIZE = 100;

const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const runBackfill = async () => {
    tallyLog.info("Scheduler", "-", "backfill", "Scanning DB for unsynced records...");

    const PENDING_USER = [TALLY_STATUS.USER_NEW, TALLY_STATUS.USER_UPDATED];
    const PENDING_PRODUCT = [TALLY_STATUS.PRODUCT_NEW, TALLY_STATUS.PRODUCT_UPDATED];
    const PENDING_ORDER = [TALLY_STATUS.ORDER_NEW, TALLY_STATUS.ORDER_UPDATED];

    const [users, products, orders] = await Promise.all([
        prismaClient.user.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_USER } }, { tallyStatus: null }] },
            select: { id: true, tallyStatus: true },
            take: 500,
        }),
        prismaClient.product.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_PRODUCT } }, { tallyStatus: null }] },
            select: { id: true, tallyStatus: true },
            take: 500,
        }),
        prismaClient.order.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_ORDER } }, { tallyStatus: null }] },
            select: { id: true },
            take: 500,
        }),
    ]);

    // Split users by action then batch
    const userCreates = users.filter((u) => u.tallyStatus !== TALLY_STATUS.USER_UPDATED).map((u) => u.id);
    const userAlters = users.filter((u) => u.tallyStatus === TALLY_STATUS.USER_UPDATED).map((u) => u.id);

    const productCreates = products.filter((p) => p.tallyStatus !== TALLY_STATUS.PRODUCT_UPDATED).map((p) => p.id);
    const productAlters = products.filter((p) => p.tallyStatus === TALLY_STATUS.PRODUCT_UPDATED).map((p) => p.id);

    await Promise.all([
        ...chunk(userCreates, BATCH_SIZE).map((ids) => enqueueUserBatch(ids, "Create")),
        ...chunk(userAlters, BATCH_SIZE).map((ids) => enqueueUserBatch(ids, "Alter")),
        ...chunk(productCreates, BATCH_SIZE).map((ids) => enqueueProductBatch(ids, "Create")),
        ...chunk(productAlters, BATCH_SIZE).map((ids) => enqueueProductBatch(ids, "Alter")),
        ...orders.map((o) => enqueueOrderSync(o.id)),
    ]);

    tallyLog.schedulerScan(users.length, products.length, orders.length);
};

export const startTallyScheduler = () => {
    const schedulerQueue = new Queue(BACKFILL_QUEUE, { connection: bullmqConnection });

    // Add repeatable job — every 5 minutes
    schedulerQueue.add("backfill", {}, {
        repeat: { every: 5 * 60 * 1000 },
        jobId: "tally-backfill",
    });

    // Worker to process the repeatable job
    const worker = new Worker(
        BACKFILL_QUEUE,
        async () => {
            await runBackfill();
        },
        { connection: bullmqConnection }
    );

    worker.on("error", (err: Error) => tallyLog.error("Scheduler", "-", "error", err.message));

    // Run immediately on startup — don't wait 5 min for first tick
    runBackfill().catch((err: Error) =>
        tallyLog.error("Scheduler", "-", "startup-backfill", err.message)
    );

    tallyLog.info("Scheduler", "-", "start", "Tally scheduler started (immediate + every 5 min backfill)");
    return { schedulerQueue, worker };
};
