import type { User } from "../generated/prisma/index.js";
import express from 'express';
declare module 'express' {
    interface Request {
        user?: User;
    }   
}