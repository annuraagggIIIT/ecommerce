import type { Request, Response } from "express";
import * as productService from "../services/product.service.ts";

export const createProduct = async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    res.json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
    const product = await productService.updateProduct(+req.params.id, req.body);
    res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
    const product = await productService.deleteProduct(+req.params.id);
    res.json(product);
};

export const listProducts = async (req: Request, res: Response) => {
    const products = await productService.listProducts();
    res.json(products);
};

export const getProductById = async (req: Request, res: Response) => {
    const product = await productService.getProductById(+req.params.id);
    res.json(product);
};
