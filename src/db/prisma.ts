import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '0414',
  database: process.env.DATABASE_NAME || 'ecommerce',
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

export const prismaClient = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'test' ? [] : ["query", "info", "warn", "error"],
});
