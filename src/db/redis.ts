import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "../secrets.ts";

export const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err: Error) => console.error("Redis error:", err.message));

export const CACHE_TTL = 300; // 5 minutes
