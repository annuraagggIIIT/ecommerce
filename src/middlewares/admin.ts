import type { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized.ts";
import { ErrorCode } from "../exceptions/root.ts";

export const adminMiddleware = async(req: Request, res: Response, next: NextFunction) => {
 const user = req.user;
  if(user && user.role === 'ADMIN') {
    next( );
  } else {
    next(new UnauthorizedException("Unauthorized: Admins only", ErrorCode.UNAUTHORIZED));
}
}
export default adminMiddleware;