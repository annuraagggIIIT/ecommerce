import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prismaClient } from "../db/prisma.ts";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "../secrets.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { InternalException } from "../exceptions/internal-exception.ts";
import { ErrorCode } from "../exceptions/root.ts";

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req: Request, res: Response) => {
    const cartItems = await prismaClient.cartItem.findMany({
        where: { userId: req.user?.id },
        include: { product: true },
    });

    if (cartItems.length === 0) {
        throw new NotFoundException("Cart is empty", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const totalAmount = cartItems.reduce(
        (acc, item) => acc + item.quantity * +item.product.price,
        0
    );

    let order;
    try {
        order = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `receipt_user_${req.user!.id}_${Date.now()}`,
        });
    } catch (razorpayError: any) {
        console.error("Razorpay order creation failed:", JSON.stringify(razorpayError));
        throw new InternalException(
            razorpayError?.error?.description || razorpayError?.message || "Razorpay order creation failed",
            razorpayError,
            ErrorCode.INRERNAL_EXCEPTION
        );
    }

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
    });
};

export const verifyPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new NotFoundException("Invalid payment signature", ErrorCode.VALIDATION_ERROR);
    }

    const cartItems = await prismaClient.cartItem.findMany({
        where: { userId: req.user?.id },
        include: { product: true },
    });

    if (cartItems.length === 0) {
        throw new NotFoundException("Cart is empty", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const address = await prismaClient.address.findFirst({
        where: { id: addressId || req.user?.defaultShippingAddressId },
    });

    if (!address) {
        throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
    }

    const price = cartItems.reduce(
        (acc, item) => acc + item.quantity * +item.product.price,
        0
    );
    const formattedAddress = `${address.lineOne},${address.lineTwo || ""},${address.city},${address.country},${address.pinCode}`;

    const order = await prismaClient.order.create({
        data: {
            user: { connect: { id: req.user!.id } },
            netAmount: price,
            address: formattedAddress,
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            products: {
                create: cartItems.map((cart) => ({
                    product: { connect: { id: cart.productId } },
                    quantity: cart.quantity,
                    address: formattedAddress,
                })),
            },
        },
        include: {
            products: { include: { product: true } },
        },
    });

    await prismaClient.orderEvent.create({
        data: { order: { connect: { id: order.id } } },
    });

    await prismaClient.cartItem.deleteMany({
        where: { userId: req.user?.id },
    });

    res.json(order);
};
