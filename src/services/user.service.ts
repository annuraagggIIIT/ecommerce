import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { enqueueUserSync } from "../integrations/tally/index.ts";

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
    const user = await prismaClient.user.update({
        where: { id: userId },
        data: { ...data, tallyStatus: TALLY_STATUS.USER_UPDATED },
    });
    try {
        await enqueueUserSync(user.id, "Alter");
    } catch {
        // Queue failure must not break user update
    }
    return user;
};
