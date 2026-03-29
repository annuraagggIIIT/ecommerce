import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { enqueueOrderSync } from "../integrations/tally/index.ts";

export const createOrder = async (userId: number, addressId?: number) => {
    const cartItems = await prismaClient.cartItem.findMany({
        where: { userId },
        include: { product: true }
    });
    if (cartItems.length === 0) {
        throw new NotFoundException("Cart is empty", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const price = cartItems.reduce((acc, item) => acc + item.quantity * +item.product.price, 0);

    const address = await prismaClient.address.findFirst({ where: { id: addressId } });
    if (!address) {
        throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
    }

    const formattedAddress = `${address.lineOne},${address.lineTwo || ''},${address.city},${address.country},${address.pinCode}`;

    const order = await prismaClient.order.create({
        data: {
            user: { connect: { id: userId } },
            netAmount: price,
            address: formattedAddress,
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
    return order;
};

export const listOrders = async (userId: number) => {
    return prismaClient.order.findMany({
        where: { userId },
        include: {
            products: { include: { product: true } },
            events: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const cancelOrder = async (orderId: number, userId: number) => {
    const order = await prismaClient.order.findFirst({
        where: { id: orderId, userId },
        include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    if (!order) {
        throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    const latestStatus = order.events[0]?.status;
    if (latestStatus === 'CANCELLED') {
        throw new NotFoundException("Order is already cancelled", ErrorCode.ORDER_ALREADY_CANCELLED);
    }
    if (latestStatus === 'DELIVERED' || latestStatus === 'OUT_FOR_DELIVERY') {
        throw new NotFoundException("Cannot cancel order in current status", ErrorCode.CANNOT_CANCEL_ORDER);
    }

    await prismaClient.orderEvent.create({
        data: { order: { connect: { id: order.id } }, status: 'CANCELLED' }
    });
};

export const getOrderById = async (orderId: number, userId: number) => {
    const order = await prismaClient.order.findFirst({
        where: { id: orderId, userId },
        include: {
            products: { include: { product: true } },
            events: { orderBy: { createdAt: 'desc' } }
        }
    });
    if (!order) {
        throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }
    return order;
};

export const listAllOrders = async (status?: string) => {
    const orders = await prismaClient.order.findMany({
        include: {
            user: { select: { id: true, name: true, email: true } },
            products: { include: { product: true } },
            events: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' }
    });
    if (!status) return orders;
    return orders.filter((o) => (o.events[0]?.status || 'PENDING') === status);
};

export const updateOrderStatus = async (orderId: number, status: string) => {
    const validStatuses = ['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        throw new NotFoundException("Invalid status", ErrorCode.VALIDATION_ERROR);
    }

    const order = await prismaClient.order.findFirst({
        where: { id: orderId },
        include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    if (!order) {
        throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    const currentStatus = order.events[0]?.status || 'PENDING';
    if (currentStatus === 'DELIVERED') {
        throw new NotFoundException("Order already delivered", ErrorCode.CANNOT_CANCEL_ORDER);
    }
    if (currentStatus === 'CANCELLED') {
        throw new NotFoundException("Order is cancelled", ErrorCode.ORDER_ALREADY_CANCELLED);
    }

    await prismaClient.orderEvent.create({
        data: { order: { connect: { id: orderId } }, status: status as any }
    });
    await prismaClient.order.update({
        where: { id: orderId },
        data: { tallyStatus: TALLY_STATUS.ORDER_UPDATED },
    });
    try {
        await enqueueOrderSync(orderId);
    } catch {
        // Queue failure must not break order status update
    }

    return prismaClient.order.findFirst({
        where: { id: orderId },
        include: {
            user: { select: { id: true, name: true, email: true } },
            products: { include: { product: true } },
            events: { orderBy: { createdAt: 'desc' } }
        }
    });
};
