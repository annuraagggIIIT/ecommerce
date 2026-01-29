import { Router } from "express";
import { login, signup } from "../controllers/auth.ts";
import { errorHandler } from "../error-handler.ts";

const authRoutes:Router = Router(); 

authRoutes.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
authRoutes.post("/signup", errorHandler(signup));
authRoutes.post("/login", errorHandler(login));

export default authRoutes;
