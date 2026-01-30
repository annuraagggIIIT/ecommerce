import { Router } from "express";
import { login, me, signup } from "../controllers/auth.ts";
import { errorHandler } from "../error-handler.ts";
import authMiddleware from "../middlewares/auth.ts";

const authRoutes:Router = Router(); 

authRoutes.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
authRoutes.post("/signup", errorHandler(signup));
authRoutes.post("/login", errorHandler(login));
authRoutes.get("/me", [authMiddleware],errorHandler(me));
export default authRoutes;
