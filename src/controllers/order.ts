import type { Request, Response } from "express";
import * as orderService from "../services/order.service.ts";

export const createOrder = async (req: Request, res: Response) => {
    const addressId = req.body.addressId || req.user?.defaultShippingAddressId;
    const order = await orderService.createOrder(req.user!.id, addressId);
    res.json(order);
};

export const listOrders = async (req: Request, res: Response) => {
    const orders = await orderService.listOrders(req.user!.id);
    res.json({ orders });
};

export const cancelOrder = async (req: Request, res: Response) => {
    await orderService.cancelOrder(+req.params.id, req.user!.id);
    res.json({ success: true, message: "Order cancelled successfully" });
};

export const getOrderById = async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(+req.params.id, req.user!.id);
    res.json(order);
};

export const listAllOrders = async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const orders = await orderService.listAllOrders(status);
    res.json({ orders });
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(+req.params.id, status);
    res.json(order);
};
