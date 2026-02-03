import { Router } from "express";
import authMiddleware from "../middlewares/auth.ts";
import { addItemToCart, changeQuantity, deleteItemFromCart, getCart } from "../controllers/cart.ts";
import { errorHandler } from "../error-handler.ts";

const cartRoutes:Router = Router();
cartRoutes.post('/',[authMiddleware],errorHandler(addItemToCart));
cartRoutes.get('/',[authMiddleware],errorHandler(getCart));
cartRoutes.delete('/:id',[authMiddleware],errorHandler(deleteItemFromCart));
cartRoutes.put('/:id',[authMiddleware],errorHandler(changeQuantity));
export default cartRoutes;