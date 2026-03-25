import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const addItemToCart = async (userId: number, productId: number, quantity: number) => {
    const existing = await prismaClient.cartItem.findFirst({ where: { userId, productId } });
    if (existing) {
        return prismaClient.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + quantity }
        });
    }
    return prismaClient.cartItem.create({ data: { userId, productId, quantity } });
};

export const getCart = async (userId: number) => {
    return prismaClient.cartItem.findMany({ where: { userId } });
};

export const deleteItemFromCart = async (cartItemId: number, userId: number) => {
    const item = await prismaClient.cartItem.findFirst({ where: { id: cartItemId, userId } });
    if (!item) {
        throw new NotFoundException("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }
    await prismaClient.cartItem.delete({ where: { id: item.id } });
};

export const changeQuantity = async (cartItemId: number, userId: number, quantity: number) => {
    const item = await prismaClient.cartItem.findFirst({ where: { id: cartItemId, userId } });
    if (!item) {
        throw new NotFoundException("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }
    return prismaClient.cartItem.update({ where: { id: item.id }, data: { quantity } });
};
