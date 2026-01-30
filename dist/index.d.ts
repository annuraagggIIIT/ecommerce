import 'dotenv/config';
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
export declare const prismaClient: PrismaClient<{
    adapter: PrismaMariaDb;
    log: ("error" | "info" | "query" | "warn")[];
}, "error" | "info" | "query" | "warn", import("./generated/prisma/runtime/client.js").DefaultArgs>;
