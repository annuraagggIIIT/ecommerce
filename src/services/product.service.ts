import { prismaClient } from "../db/prisma.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const createProduct = async (data: any) => {
    return prismaClient.product.create({
        data: { ...data, tags: Array.isArray(data.tags) ? data.tags.join(",") : data.tags }
    });
};

export const updateProduct = async (id: number, data: any) => {
    try {
        if (data.tags && Array.isArray(data.tags)) {
            data.tags = data.tags.join(",");
        }
        return await prismaClient.product.update({ where: { id }, data });
    } catch {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
};

export const deleteProduct = async (id: number) => {
    try {
        return await prismaClient.product.delete({ where: { id } });
    } catch {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
};

export const listProducts = async () => {
    return prismaClient.product.findMany();
};

export const getProductById = async (id: number) => {
    const product = await prismaClient.product.findFirst({ where: { id } });
    if (!product) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
    return product;
};
