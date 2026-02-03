import type { Request, Response } from "express";
import { CreateCartSchema } from "../schema/cart.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { prismaClient } from "../db/prisma.ts";

export const addItemToCart = async (req: Request, res: Response) => {
    const validatedData = CreateCartSchema.safeParse(req.body);
    if (!validatedData.success) {
        throw new NotFoundException("Invalid data", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }
    if (!req.user?.id) {
        throw new NotFoundException("User not found", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }

    const existingCartItem = await prismaClient.cartItem.findFirst({
        where: {
            userId: req.user.id,
            productId: validatedData.data.productId
        }
    });

    let cartItem;
    if (existingCartItem) {
        cartItem = await prismaClient.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: existingCartItem.quantity + validatedData.data.quantity }
        });
    } else {
        cartItem = await prismaClient.cartItem.create({
            data: {
                ...validatedData.data,
                userId: req.user.id
            }
        });
    }
    res.json({ cartItem });
}

export const getCart = async (req: Request, res: Response) => {
    const cartItems = await prismaClient.cartItem.findMany({
        where: {
            userId: req.user?.id
        },
    });
    res.json({ cartItems });
}

export const deleteItemFromCart = async (req: Request, res: Response) => {
    const cartItem = await prismaClient.cartItem.findFirst({
        where: {
            id: +req.params.id,
            userId: req.user?.id
        }
    });

    if (!cartItem) {
        throw new NotFoundException("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    await prismaClient.cartItem.delete({
        where: { id: cartItem.id }
    });
    res.json({ success: true });
}

export const changeQuantity = async (req: Request, res: Response) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
        throw new NotFoundException("Invalid quantity", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }

    const cartItem = await prismaClient.cartItem.findFirst({
        where: {
            id: +req.params.id,
            userId: req.user?.id
        }
    });

    if (!cartItem) {
        throw new NotFoundException("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    const updatedCartItem = await prismaClient.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity }
    });

    res.json({ cartItem: updatedCartItem });
} 