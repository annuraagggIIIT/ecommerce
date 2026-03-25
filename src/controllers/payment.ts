import type { Request, Response } from "express";
import * as paymentService from "../services/payment.service.ts";

export const createRazorpayOrder = async (req: Request, res: Response) => {
    const result = await paymentService.createRazorpayOrder(req.user!.id);
    res.json(result);
};

export const verifyPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body;
    const order = await paymentService.verifyAndCreateOrder(
        req.user!.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        addressId || req.user?.defaultShippingAddressId
    );
    res.json(order);
};
