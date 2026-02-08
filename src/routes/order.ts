import { Router } from "express";
import authMiddleware from "../middlewares/auth.ts";
import adminMiddleware from "../middlewares/admin.ts";
import { createOrder, listOrders, cancelOrder, getOrderById, listAllOrders, updateOrderStatus } from "../controllers/order.ts";
import { errorHandler } from "../error-handler.ts";

const orderRoutes: Router = Router();

// User routes
orderRoutes.post('/', [authMiddleware], errorHandler(createOrder));
orderRoutes.get('/', [authMiddleware], errorHandler(listOrders));
orderRoutes.get('/:id', [authMiddleware], errorHandler(getOrderById));
orderRoutes.put('/:id/cancel', [authMiddleware], errorHandler(cancelOrder));

// Admin routes
orderRoutes.get('/admin/all', [authMiddleware, adminMiddleware], errorHandler(listAllOrders));
orderRoutes.put('/admin/:id/status', [authMiddleware, adminMiddleware], errorHandler(updateOrderStatus));

export default orderRoutes;
