import type { Request, Response } from "express";
import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const createOrder = async (req: Request, res: Response) => {
    const cartItems = await prismaClient.cartItem.findMany({
        where: {
            userId: req.user?.id
        },
        include: {
            product: true
        }
    });
    if (cartItems.length === 0) {
        throw new NotFoundException("Cart is empty", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const price = cartItems.reduce((acc, item) => acc + item.quantity * +item.product.price, 0);

    const address = await prismaClient.address.findFirst({
        where: {
            id: req.body.addressId || req.user?.defaultShippingAddressId
        }
    });
    if (!address) {
        throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
    }

    const formattedAddress = `${address.lineOne},${address.lineTwo || ''},${address.city},${address.country},${address.pinCode}`;

    const order = await prismaClient.order.create({
        data: {
            user: { connect: { id: req.user!.id } },
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
        include: {
            products: {
                include: {
                    product: true
                }
            }
        }
    });

    await prismaClient.orderEvent.create({
        data: {
            order: { connect: { id: order.id } }
        }
    });

    await prismaClient.cartItem.deleteMany({
        where: {
            userId: req.user?.id
        }
    });

    res.json(order);
};

export const listOrders = async (req: Request, res: Response) => {
    const orders = await prismaClient.order.findMany({
        where: {
            userId: req.user?.id
        },
        include: {
            products: {
                include: {
                    product: true
                }
            },
            events: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    res.json({ orders });
};

export const cancelOrder = async (req: Request, res: Response) => {
    const order = await prismaClient.order.findFirst({
        where: {
            id: +req.params.id,
            userId: req.user?.id
        },
        include: {
            events: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        }
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
        data: {
            order: { connect: { id: order.id } },
            status: 'CANCELLED'
        }
    });

    res.json({ success: true, message: "Order cancelled successfully" });
};

export const getOrderById = async (req: Request, res: Response) => {
    const order = await prismaClient.order.findFirst({
        where: {
            id: +req.params.id,
            userId: req.user?.id
        },
        include: {
            products: {
                include: {
                    product: true
                }
            },
            events: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!order) {
        throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    res.json(order);
};

// Admin functions
export const listAllOrders = async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;

    const orders = await prismaClient.order.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            products: {
                include: {
                    product: true
                }
            },
            events: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Filter by latest status if provided
    let filteredOrders = orders;
    if (status) {
        filteredOrders = orders.filter(order => {
            const latestStatus = order.events[0]?.status || 'PENDING';
            return latestStatus === status;
        });
    }

    res.json({ orders: filteredOrders });
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
        throw new NotFoundException("Invalid status", ErrorCode.VALIDATION_ERROR);
    }

    const order = await prismaClient.order.findFirst({
        where: {
            id: +req.params.id
        },
        include: {
            events: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        }
    });

    if (!order) {
        throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    const currentStatus = order.events[0]?.status || 'PENDING';

    // Prevent updating already delivered or cancelled orders
    if (currentStatus === 'DELIVERED') {
        throw new NotFoundException("Order already delivered", ErrorCode.CANNOT_CANCEL_ORDER);
    }
    if (currentStatus === 'CANCELLED') {
        throw new NotFoundException("Order is cancelled", ErrorCode.ORDER_ALREADY_CANCELLED);
    }

    await prismaClient.orderEvent.create({
        data: {
            order: { connect: { id: order.id } },
            status: status
        }
    });

    const updatedOrder = await prismaClient.order.findFirst({
        where: { id: order.id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            products: {
                include: {
                    product: true
                }
            },
            events: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    res.json(updatedOrder);
};
