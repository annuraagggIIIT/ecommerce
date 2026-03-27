import { prismaClient } from "../db/prisma.ts";
import { redisClient, CACHE_TTL } from "../db/redis.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

const KEYS = {
    all: "products:all",
    byId: (id: number) => `products:${id}`,
};

export const createProduct = async (data: any) => {
    const product = await prismaClient.product.create({
        data: { ...data, tags: Array.isArray(data.tags) ? data.tags.join(",") : data.tags }
    });
    await redisClient.del(KEYS.all);
    return product;
};

export const updateProduct = async (id: number, data: any) => {
    try {
        if (data.tags && Array.isArray(data.tags)) {
            data.tags = data.tags.join(",");
        }
        const product = await prismaClient.product.update({ where: { id }, data });
        await redisClient.del(KEYS.all, KEYS.byId(id));
        return product;
    } catch {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
};

export const deleteProduct = async (id: number) => {
    try {
        const product = await prismaClient.product.delete({ where: { id } });
        await redisClient.del(KEYS.all, KEYS.byId(id));
        return product;
    } catch {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
};

export const listProducts = async () => {
    const cached = await redisClient.get(KEYS.all);
    if (cached) {
        return JSON.parse(cached);
    }
    const products = await prismaClient.product.findMany();
    await redisClient.setex(KEYS.all, CACHE_TTL, JSON.stringify(products));
    return products;
};

export const getProductById = async (id: number) => {
    const cached = await redisClient.get(KEYS.byId(id));
    if (cached) {
        return JSON.parse(cached);
    }
    const product = await prismaClient.product.findFirst({ where: { id } });
    if (!product) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
    await redisClient.setex(KEYS.byId(id), CACHE_TTL, JSON.stringify(product));
    return product;
};
