import 'dotenv/config';
import express, { type Express } from "express";
import authRoutes from "./routes/auth.ts";
import { PORT } from "./secrets.ts";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { errorMiddleware } from './middlewares/errors.ts';
import { SignUpSchema } from './schema/user.ts';

const app: Express = express();
app.use(express.json());
app.use("/api", authRoutes);
app.use(errorMiddleware)
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '0414',
  database: process.env.DATABASE_NAME || 'ecommerce',
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 5
});

export const prismaClient = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});