import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "../../../secrets.ts";

export const bullmqConnection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
};
