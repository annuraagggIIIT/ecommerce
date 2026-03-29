import { prismaClient } from "../db/prisma.ts";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "../db/redis.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { enqueueProductSync } from "../integrations/tally/index.ts";

const KEYS = {
    all: "products:all",
    byId: (id: number) => `products:${id}`,
};

export const createProduct = async (data: any) => {
    const product = await prismaClient.product.create({
        data: { ...data, tags: Array.isArray(data.tags) ? data.tags.join(",") : data.tags, tallyStatus: TALLY_STATUS.PRODUCT_NEW }
    });
    await cacheDel(KEYS.all);
    try {
        await enqueueProductSync(product.id, "Create");
    } catch {
        // Queue failure must not break product creation
    }
    return product;
};

export const updateProduct = async (id: number, data: any) => {
    try {
        if (data.tags && Array.isArray(data.tags)) {
            data.tags = data.tags.join(",");
        }
        const product = await prismaClient.product.update({ where: { id }, data: { ...data, tallyStatus: TALLY_STATUS.PRODUCT_UPDATED } });
        await cacheDel(KEYS.all, KEYS.byId(id));
        try {
            await enqueueProductSync(product.id, "Alter");
        } catch {
            // Queue failure must not break product update
        }
        return product;
    } catch (err: any) {
        if (err?.code === "P2025") {
            throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
        }
        throw err;
    }
};

export const deleteProduct = async (id: number) => {
    try {
        const product = await prismaClient.product.delete({ where: { id } });
        await cacheDel(KEYS.all, KEYS.byId(id));
        return product;
    } catch {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
};

export const listProducts = async () => {
    const cached = await cacheGet(KEYS.all);
    if (cached) return JSON.parse(cached);
    const products = await prismaClient.product.findMany();
    await cacheSet(KEYS.all, CACHE_TTL, JSON.stringify(products));
    return products;
};

export const getProductById = async (id: number) => {
    const cached = await cacheGet(KEYS.byId(id));
    if (cached) return JSON.parse(cached);
    const product = await prismaClient.product.findFirst({ where: { id } });
    if (!product) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
    await cacheSet(KEYS.byId(id), CACHE_TTL, JSON.stringify(product));
    return product;
};
