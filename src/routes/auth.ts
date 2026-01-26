import { Router } from "express";
import { signup } from "../controllers/auth.ts";

const authRoutes:Router = Router(); 

authRoutes.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
authRoutes.post("/signup",signup);
export default authRoutes;
