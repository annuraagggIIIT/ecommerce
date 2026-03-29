import Razorpay from "razorpay";
import crypto from "crypto";
import { prismaClient } from "../db/prisma.ts";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "../secrets.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { InternalException } from "../exceptions/internal-exception.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { enqueueOrderSync } from "../integrations/tally/index.ts";

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

export const createRazorpayOrder = async (userId: number) => {
    const cartItems = await prismaClient.cartItem.findMany({
        where: { userId },
        include: { product: true }
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
            receipt: `receipt_user_${userId}_${Date.now()}`
        });
    } catch (razorpayError: any) {
        throw new InternalException(
            razorpayError?.error?.description || "Razorpay order creation failed",
            razorpayError,
            ErrorCode.INRERNAL_EXCEPTION
        );
    }

    return { orderId: order.id, amount: order.amount, currency: order.currency, key: RAZORPAY_KEY_ID };
};

export const verifyAndCreateOrder = async (
    userId: number,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    addressId?: number
) => {
    const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new NotFoundException("Invalid payment signature", ErrorCode.VALIDATION_ERROR);
    }

    const cartItems = await prismaClient.cartItem.findMany({
        where: { userId },
        include: { product: true }
    });
    if (cartItems.length === 0) {
        throw new NotFoundException("Cart is empty", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const address = await prismaClient.address.findFirst({ where: { id: addressId } });
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
            user: { connect: { id: userId } },
            netAmount: price,
            address: formattedAddress,
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            tallyStatus: TALLY_STATUS.ORDER_NEW,
            products: {
                create: cartItems.map((cart) => ({
                    product: { connect: { id: cart.productId } },
                    quantity: cart.quantity,
                    address: formattedAddress
                }))
            }
        },
        include: { products: { include: { product: true } } }
    });

    await prismaClient.orderEvent.create({ data: { order: { connect: { id: order.id } } } });
    await prismaClient.cartItem.deleteMany({ where: { userId } });
    try {
        await enqueueOrderSync(order.id);
    } catch {
        // Queue failure must not break payment verification
    }
    return order;
};
