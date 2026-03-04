import { Router } from "express";
import authRoutes from "./auth.ts";
import productsRoutes from "./product.ts";
import cartRoutes from "./cart.ts";
import orderRoutes from "./order.ts";
import paymentRoutes from "./payment.ts";

const rootRouter: Router = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/products", productsRoutes);
rootRouter.use("/cart", cartRoutes);
rootRouter.use("/orders", orderRoutes);
rootRouter.use("/payments", paymentRoutes);

export default rootRouter;
