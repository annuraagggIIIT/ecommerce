import { Router } from "express";
import { errorHandler } from "../error-handler.ts";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "../controllers/product.ts";
import authMiddleware from "../middlewares/auth.ts";
import adminMiddleware from "../middlewares/admin.ts";

const productsRoutes:Router = Router();
productsRoutes.post('/',[authMiddleware,adminMiddleware],errorHandler(createProduct));  
productsRoutes.put('/:id',[authMiddleware,adminMiddleware],errorHandler(updateProduct));  
productsRoutes.delete('/:id',[authMiddleware,adminMiddleware],errorHandler(deleteProduct));
productsRoutes.get('/', errorHandler(listProducts));
productsRoutes.get('/:id', errorHandler(getProductById));
export default productsRoutes;