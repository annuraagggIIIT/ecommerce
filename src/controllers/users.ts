import type { Request, Response } from "express";
import { ErrorCode } from "../exceptions/root.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { AddressSchema, UpdateUserSchema } from "../schema/user.ts";
import { prismaClient } from "../db/prisma.ts";
import type { User, Address } from "../generated/prisma/client.js";

export const addAddress = async (req: Request, res: Response) => {
    AddressSchema.parse(req.body);

    const address = await prismaClient.address.create({
        data: {
            ...req.body,
            userId: req.user?.id
        }
    });
    res.json(address);
}


export const deleteAddress = async (req: Request, res: Response) => {
    try {
        await prismaClient.address.delete({
            where: {
                id: +req.params.id,
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
    }
}


export const listAddress = async (req: Request, res: Response) => {
    const addresses = await prismaClient.address.findMany({
        where: {
            userId: req.user?.id
        }
    });
    res.json(addresses);
}
export const updateUser = async (req: Request, res: Response) => {
    const validatedData = UpdateUserSchema.parse(req.body)
    let shippingAddressId: Address;
    let billingAddressId: Address;
    if (validatedData.defaultShippingAddressId) {
        try {
            shippingAddressId = await prismaClient.address.findFirstOrThrow({
                where: {
                    id: validatedData.defaultShippingAddressId
                }
            });

        } catch (err) {
            throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
        }
        if (shippingAddressId.userId !== req.user?.id) {
            throw new NotFoundException("Address does not belong to user", ErrorCode.ADDRESS_DOES_NOT_BELONG_TO_USER);
        }
    }
    if (validatedData.defaultBillingAddressId) {
        try {
            billingAddressId = await prismaClient.address.findFirstOrThrow({
                where: {
                    id: validatedData.defaultBillingAddressId
                }
            });

        } catch (err) {
            throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
        }
        if (billingAddressId.userId !== req.user?.id) {
            throw new NotFoundException("Address does not belong to user", ErrorCode.ADDRESS_DOES_NOT_BELONG_TO_USER);
        }
    }
    const updatedUser: User = await prismaClient.user.update({
        where: {
            id: req.user?.id
        },
        data: validatedData

    });
    res.json(updatedUser);

}
