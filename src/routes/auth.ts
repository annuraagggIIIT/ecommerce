import { Router } from "express";
import { login, signup } from "../controllers/auth.ts";

const authRoutes:Router = Router(); 

authRoutes.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);

export default authRoutes;
