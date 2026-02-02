import 'dotenv/config';
import express, { type Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.ts";
import { PORT } from "./secrets.ts";
import { errorMiddleware } from './middlewares/errors.ts';
import productsRoutes from './routes/product.ts';
export { prismaClient } from './db/prisma.ts';

const app: Express = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/products", productsRoutes);
app.use(errorMiddleware)


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});