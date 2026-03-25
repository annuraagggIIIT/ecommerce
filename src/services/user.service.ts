import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const addAddress = async (userId: number, data: any) => {
    return prismaClient.address.create({ data: { ...data, userId } });
};

export const deleteAddress = async (addressId: number) => {
    try {
        await prismaClient.address.delete({ where: { id: addressId } });
    } catch {
        throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
    }
};

export const listAddresses = async (userId: number) => {
    return prismaClient.address.findMany({ where: { userId } });
};

export const updateUser = async (
    userId: number,
    data: { name?: string; defaultShippingAddressId?: number; defaultBillingAddressId?: number }
) => {
    if (data.defaultShippingAddressId) {
        let addr;
        try {
            addr = await prismaClient.address.findFirstOrThrow({ where: { id: data.defaultShippingAddressId } });
        } catch {
            throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
        }
        if (addr.userId !== userId) {
            throw new NotFoundException("Address does not belong to user", ErrorCode.ADDRESS_DOES_NOT_BELONG_TO_USER);
        }
    }
    if (data.defaultBillingAddressId) {
        let addr;
        try {
            addr = await prismaClient.address.findFirstOrThrow({ where: { id: data.defaultBillingAddressId } });
        } catch {
            throw new NotFoundException("Address not found", ErrorCode.ADDRESS_NOT_FOUND);
        }
        if (addr.userId !== userId) {
            throw new NotFoundException("Address does not belong to user", ErrorCode.ADDRESS_DOES_NOT_BELONG_TO_USER);
        }
    }
    return prismaClient.user.update({ where: { id: userId }, data });
};
