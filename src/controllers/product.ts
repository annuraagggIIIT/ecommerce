import type { Request, Response } from "express";
import { prismaClient } from "../index.ts";
import { ca } from "zod/locales";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const createProduct = async (req: Request, res: Response) => {
    const product = await prismaClient.product.create({
        data: {
            ...req.body,
            tags: req.body.tags.join(",")
        }
    });
    res.json(product);
}
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = req.body;
        if (product.tags) {
            product.tags = product.tags.join(",");
        }
        const updatedProduct = await prismaClient.product.update({
            where: { id: +req.params.id },
            data: product
        });
        res.json(updatedProduct);
    }
    catch (err) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = req.body;
        const deletedProduct = await prismaClient.product.delete({
            where: { id: +req.params.id },
        });
        res.json(deletedProduct);
    }
    catch (err) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
}
export const listProducts = async (req: Request, res: Response) => {
   try{ const products = await prismaClient.product.findMany();
    res.json(products);
   }
    catch(err){
        throw new NotFoundException("Products not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
}
export  const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await prismaClient.product.findFirst({  
            where: { id: +req.params.id },
        });
        if (!product) {
            throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
        }   
        res.json(product);
    }
    catch (err) {
        throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
    }
}