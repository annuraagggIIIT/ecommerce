import { Queue } from "bullmq";
import { bullmqConnection } from "./connection.ts";

export interface OrderSyncJobData {
    orderId: number;
}

export const orderQueue = new Queue<OrderSyncJobData>("tally-orders", {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
});

export const enqueueOrderSync = async (orderId: number) => {
    await orderQueue.add("order-sync", { orderId }, { jobId: `order-${orderId}` });
};
