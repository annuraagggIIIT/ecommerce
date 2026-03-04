import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.ts";
import { errorHandler } from "../error-handler.ts";
import { createRazorpayOrder, verifyPayment } from "../controllers/payment.ts";

const paymentRoutes: Router = Router();

paymentRoutes.post("/create-order", authMiddleware, errorHandler(createRazorpayOrder));
paymentRoutes.post("/verify", authMiddleware, errorHandler(verifyPayment));

export default paymentRoutes;
