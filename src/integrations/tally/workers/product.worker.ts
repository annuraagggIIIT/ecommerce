import { Worker, type Job } from "bullmq";
import { prismaClient } from "../../../db/prisma.ts";
import { syncStockItemBatch } from "../tally.service.ts";
import { TALLY_STATUS } from "../tally.status.ts";
import { tallyLog } from "../logs/tally.logger.ts";
import { bullmqConnection } from "../queues/connection.ts";
import type { ProductSyncJobData } from "../queues/product.queue.ts";

const BATCH_SIZE = 100;

export const startProductWorker = () => {
    const worker = new Worker<ProductSyncJobData>(
        "tally-products",
        async (job: Job<ProductSyncJobData>) => {
            const { productIds, action } = job.data;

            // Fetch only those still needing sync
            const products = await prismaClient.product.findMany({
                where: {
                    id: { in: productIds },
                    tallyStatus: { not: TALLY_STATUS.PRODUCT_SYNCED },
                },
                select: { id: true, name: true },
            });

            if (products.length === 0) return;

            tallyLog.info("Product", `batch(${products.length})`, action, `jobId=${job.id ?? ""} attempt=${job.attemptsMade + 1}`);

            for (let i = 0; i < products.length; i += BATCH_SIZE) {
                const chunk = products.slice(i, i + BATCH_SIZE);

                const result = await syncStockItemBatch(
                    chunk.map((p) => ({ name: p.name, action }))
                );

                if (!result.success) {
                    tallyLog.error("Product", `batch(${chunk.length})`, action, result.message ?? "Tally returned failure", result.rawXml);
                    throw new Error(result.message ?? "Tally sync failed");
                }

                await prismaClient.product.updateMany({
                    where: { id: { in: chunk.map((p) => p.id) } },
                    data: { tallyStatus: TALLY_STATUS.PRODUCT_SYNCED, lastTallySyncAt: new Date() },
                });

                tallyLog.success("Product", `batch(${chunk.length})`, action, `Stock items synced (offset=${i})`);
            }
        },
        { connection: bullmqConnection, concurrency: 5 }
    );

    worker.on("failed", async (job: Job<ProductSyncJobData> | undefined, err: Error) => {
        if (!job) return;
        const maxAttempts = job.opts.attempts ?? 5;
        if (job.attemptsMade >= maxAttempts) {
            const { productIds, action } = job.data;
            tallyLog.jobFailed("Product", `batch(${productIds.length})`, job.id ?? "", maxAttempts, err.message);
            await prismaClient.product.updateMany({
                where: { id: { in: productIds } },
                data: { tallyStatus: TALLY_STATUS.PRODUCT_FAILED },
            }).catch((updateErr: Error) =>
                tallyLog.error("Product", `batch(${productIds.length})`, action, `Failed to update PRODUCT_FAILED status: ${updateErr.message}`)
            );
        }
    });

    worker.on("error", (err: Error) => tallyLog.error("Product", "-", "worker-error", err.message));

    tallyLog.workerStart("Product", 5);
    return worker;
};
