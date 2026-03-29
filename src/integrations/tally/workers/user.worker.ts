import { Worker, type Job } from "bullmq";
import { prismaClient } from "../../../db/prisma.ts";
import { syncLedgerBatch } from "../tally.service.ts";
import { TALLY_STATUS } from "../tally.status.ts";
import { tallyLog } from "../logs/tally.logger.ts";
import { bullmqConnection } from "../queues/connection.ts";
import type { UserSyncJobData } from "../queues/user.queue.ts";

const BATCH_SIZE = 100;

export const startUserWorker = () => {
    const worker = new Worker<UserSyncJobData>(
        "tally-users",
        async (job: Job<UserSyncJobData>) => {
            const { userIds, action } = job.data;

            // Fetch only those still needing sync (handles race conditions / double-enqueue)
            const users = await prismaClient.user.findMany({
                where: {
                    id: { in: userIds },
                    tallyStatus: { not: TALLY_STATUS.USER_SYNCED },
                },
                select: { id: true, name: true, email: true },
            });

            if (users.length === 0) return;

            tallyLog.info("User", `batch(${users.length})`, action, `jobId=${job.id ?? ""} attempt=${job.attemptsMade + 1}`);

            // Process in sub-batches of BATCH_SIZE to keep XML payloads manageable
            for (let i = 0; i < users.length; i += BATCH_SIZE) {
                const chunk = users.slice(i, i + BATCH_SIZE);

                const result = await syncLedgerBatch(
                    chunk.map((u) => ({ name: u.name, email: u.email, action }))
                );

                if (!result.success) {
                    tallyLog.error("User", `batch(${chunk.length})`, action, result.message ?? "Tally returned failure", result.rawXml);
                    throw new Error(result.message ?? "Tally sync failed");
                }

                await prismaClient.user.updateMany({
                    where: { id: { in: chunk.map((u) => u.id) } },
                    data: { tallyStatus: TALLY_STATUS.USER_SYNCED, lastTallySyncAt: new Date() },
                });

                tallyLog.success("User", `batch(${chunk.length})`, action, `Ledgers synced (offset=${i})`);
            }
        },
        { connection: bullmqConnection, concurrency: 10 }
    );

    worker.on("failed", async (job: Job<UserSyncJobData> | undefined, err: Error) => {
        if (!job) return;
        const maxAttempts = job.opts.attempts ?? 5;
        if (job.attemptsMade >= maxAttempts) {
            const { userIds, action } = job.data;
            tallyLog.jobFailed("User", `batch(${userIds.length})`, job.id ?? "", maxAttempts, err.message);
            await prismaClient.user.updateMany({
                where: { id: { in: userIds } },
                data: { tallyStatus: TALLY_STATUS.USER_FAILED },
            }).catch((updateErr: Error) =>
                tallyLog.error("User", `batch(${userIds.length})`, action, `Failed to update USER_FAILED status: ${updateErr.message}`)
            );
        }
    });

    worker.on("error", (err: Error) => tallyLog.error("User", "-", "worker-error", err.message));

    tallyLog.workerStart("User", 10);
    return worker;
};
