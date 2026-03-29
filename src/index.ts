import 'dotenv/config';
import express, { type Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.ts";
import { PORT } from "./secrets.ts";
import { errorMiddleware } from './middlewares/errors.ts';
import productsRoutes from './routes/product.ts';
import userRoutes from './routes/users.ts';
import cartRoutes from './routes/cart.ts';
import orderRoutes from './routes/order.ts';
import paymentRoutes from './routes/payment.ts';
import tallyRoutes from './routes/tally.ts';
import { startUserWorker, startProductWorker, startOrderWorker, startTallyScheduler } from './integrations/tally/index.ts';
export { prismaClient } from './db/prisma.ts';

const app: Express = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tally", tallyRoutes);
app.use(errorMiddleware)


startUserWorker();
startProductWorker();
startOrderWorker();
startTallyScheduler();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});