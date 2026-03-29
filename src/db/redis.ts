import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "../secrets.ts";

export const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        if (times >= 3) {
            console.error(`[Redis] Could not connect after ${times} attempts — caching disabled`);
            return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
    },
});

redisClient.on("connect", () => console.log("[Redis] Connected"));
redisClient.on("error", (err: Error) => {
    const msg = err.message || String(err);
    if (!msg.includes("ECONNREFUSED") || process.env.NODE_ENV !== "production") {
        console.error("[Redis] Error:", msg);
    }
});

export const CACHE_TTL = 300; // 5 minutes

/**
 * Safe wrapper — returns null instead of throwing when Redis is unavailable.
 * Use this instead of redisClient.get() directly in services.
 */
export const cacheGet = async (key: string): Promise<string | null> => {
    try { return await redisClient.get(key); }
    catch { return null; }
};

export const cacheSet = async (key: string, ttl: number, value: string): Promise<void> => {
    try { await redisClient.setex(key, ttl, value); }
    catch { /* Redis down — skip cache write, serve from DB */ }
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
    try { await redisClient.del(...keys); }
    catch { /* Redis down — skip invalidation */ }
};
