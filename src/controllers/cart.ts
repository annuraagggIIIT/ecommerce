import type { Request, Response } from "express";
import { CreateCartSchema } from "../schema/cart.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import * as cartService from "../services/cart.service.ts";

export const addItemToCart = async (req: Request, res: Response) => {
    const validatedData = CreateCartSchema.safeParse(req.body);
    if (!validatedData.success) {
        throw new NotFoundException("Invalid data", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }
    if (!req.user?.id) {
        throw new NotFoundException("User not found", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }
    const cartItem = await cartService.addItemToCart(
        req.user.id,
        validatedData.data.productId,
        validatedData.data.quantity
    );
    res.json({ cartItem });
};

export const getCart = async (req: Request, res: Response) => {
    const cartItems = await cartService.getCart(req.user!.id);
    res.json({ cartItems });
};

export const deleteItemFromCart = async (req: Request, res: Response) => {
    await cartService.deleteItemFromCart(+req.params.id, req.user!.id);
    res.json({ success: true });
};

export const changeQuantity = async (req: Request, res: Response) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
        throw new NotFoundException("Invalid quantity", ErrorCode.FAILED_TO_ADD_ITEM_TO_CART);
    }
    const cartItem = await cartService.changeQuantity(+req.params.id, req.user!.id, quantity);
    res.json({ cartItem });
};
