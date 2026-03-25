import type { Request, Response } from "express";
import { AddressSchema, UpdateUserSchema } from "../schema/user.ts";
import * as userService from "../services/user.service.ts";

export const addAddress = async (req: Request, res: Response) => {
    AddressSchema.parse(req.body);
    const address = await userService.addAddress(req.user!.id, req.body);
    res.json(address);
};

export const deleteAddress = async (req: Request, res: Response) => {
    await userService.deleteAddress(+req.params.id);
    res.json({ success: true });
};

export const listAddress = async (req: Request, res: Response) => {
    const addresses = await userService.listAddresses(req.user!.id);
    res.json(addresses);
};

export const updateUser = async (req: Request, res: Response) => {
    const validatedData = UpdateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.user!.id, validatedData);
    res.json(user);
};
