import { Queue } from "bullmq";
import { bullmqConnection } from "./connection.ts";

export interface UserSyncJobData {
    userIds: number[];
    action: "Create" | "Alter";
}

export const userQueue = new Queue<UserSyncJobData>("tally-users", {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
});

/** Enqueue a single user (used by order worker for dependency re-enqueue) */
export const enqueueUserSync = async (userId: number, action: "Create" | "Alter") => {
    await userQueue.add("user-sync", { userIds: [userId], action }, { jobId: `user-${userId}` });
};

/** Enqueue a batch of users (used by scheduler — no per-user dedup needed) */
export const enqueueUserBatch = async (userIds: number[], action: "Create" | "Alter") => {
    await userQueue.add("user-batch", { userIds, action });
};
