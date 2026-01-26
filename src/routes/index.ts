import { Router } from "express";
import authRoutes from "./auth.ts";

const rootRouter:Router = Router();

rootRouter.use("/auth", authRoutes);

export default rootRouter;
