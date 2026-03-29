import { Queue } from "bullmq";
import { bullmqConnection } from "./connection.ts";

export interface ProductSyncJobData {
    productIds: number[];
    action: "Create" | "Alter";
}

export const productQueue = new Queue<ProductSyncJobData>("tally-products", {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
});

/** Enqueue a single product (used by order worker for dependency re-enqueue) */
export const enqueueProductSync = async (productId: number, action: "Create" | "Alter") => {
    await productQueue.add("product-sync", { productIds: [productId], action }, { jobId: `product-${productId}` });
};

/** Enqueue a batch of products (used by scheduler — no per-product dedup needed) */
export const enqueueProductBatch = async (productIds: number[], action: "Create" | "Alter") => {
    await productQueue.add("product-batch", { productIds, action });
};
