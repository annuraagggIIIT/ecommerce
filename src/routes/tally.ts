import { Router, type Request, type Response } from "express";
import authMiddleware from "../middlewares/auth.ts";
import adminMiddleware from "../middlewares/admin.ts";
import { errorHandler } from "../error-handler.ts";
import { prismaClient } from "../db/prisma.ts";
import { enqueueUserSync, enqueueProductSync, enqueueOrderSync } from "../integrations/tally/index.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";

const tallyRoutes: Router = Router();

// POST /api/tally/sync  — enqueue all pending records (admin only)
tallyRoutes.post(
    "/sync",
    [authMiddleware, adminMiddleware],
    errorHandler(async (_req: Request, res: Response) => {
        const PENDING_USER = [TALLY_STATUS.USER_NEW, TALLY_STATUS.USER_UPDATED];
        const PENDING_PRODUCT = [TALLY_STATUS.PRODUCT_NEW, TALLY_STATUS.PRODUCT_UPDATED];
        const PENDING_ORDER = [TALLY_STATUS.ORDER_NEW, TALLY_STATUS.ORDER_UPDATED];

        const [users, products, orders] = await Promise.all([
            prismaClient.user.findMany({
                where: { OR: [{ tallyStatus: { in: PENDING_USER } }, { tallyStatus: null }] },
                select: { id: true, tallyStatus: true },
                take: 500,
            }),
            prismaClient.product.findMany({
                where: { OR: [{ tallyStatus: { in: PENDING_PRODUCT } }, { tallyStatus: null }] },
                select: { id: true, tallyStatus: true },
                take: 500,
            }),
            prismaClient.order.findMany({
                where: { OR: [{ tallyStatus: { in: PENDING_ORDER } }, { tallyStatus: null }] },
                select: { id: true },
                take: 500,
            }),
        ]);

        await Promise.all([
            ...users.map((u) => enqueueUserSync(u.id, u.tallyStatus === TALLY_STATUS.USER_UPDATED ? "Alter" : "Create")),
            ...products.map((p) => enqueueProductSync(p.id, p.tallyStatus === TALLY_STATUS.PRODUCT_UPDATED ? "Alter" : "Create")),
            ...orders.map((o) => enqueueOrderSync(o.id)),
        ]);

        res.json({
            message: "Tally sync enqueued",
            enqueued: { users: users.length, products: products.length, orders: orders.length },
        });
    })
);

// POST /api/tally/sync/users — enqueue pending users
tallyRoutes.post(
    "/sync/users",
    [authMiddleware, adminMiddleware],
    errorHandler(async (_req: Request, res: Response) => {
        const PENDING_USER = [TALLY_STATUS.USER_NEW, TALLY_STATUS.USER_UPDATED];
        const users = await prismaClient.user.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_USER } }, { tallyStatus: null }] },
            select: { id: true, tallyStatus: true },
            take: 500,
        });
        await Promise.all(
            users.map((u) => enqueueUserSync(u.id, u.tallyStatus === TALLY_STATUS.USER_UPDATED ? "Alter" : "Create"))
        );
        res.json({ message: "Users sync enqueued", enqueued: users.length });
    })
);

// POST /api/tally/sync/products — enqueue pending products
tallyRoutes.post(
    "/sync/products",
    [authMiddleware, adminMiddleware],
    errorHandler(async (_req: Request, res: Response) => {
        const PENDING_PRODUCT = [TALLY_STATUS.PRODUCT_NEW, TALLY_STATUS.PRODUCT_UPDATED];
        const products = await prismaClient.product.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_PRODUCT } }, { tallyStatus: null }] },
            select: { id: true, tallyStatus: true },
            take: 500,
        });
        await Promise.all(
            products.map((p) => enqueueProductSync(p.id, p.tallyStatus === TALLY_STATUS.PRODUCT_UPDATED ? "Alter" : "Create"))
        );
        res.json({ message: "Products sync enqueued", enqueued: products.length });
    })
);

// POST /api/tally/sync/orders — enqueue pending orders
tallyRoutes.post(
    "/sync/orders",
    [authMiddleware, adminMiddleware],
    errorHandler(async (_req: Request, res: Response) => {
        const PENDING_ORDER = [TALLY_STATUS.ORDER_NEW, TALLY_STATUS.ORDER_UPDATED];
        const orders = await prismaClient.order.findMany({
            where: { OR: [{ tallyStatus: { in: PENDING_ORDER } }, { tallyStatus: null }] },
            select: { id: true },
            take: 500,
        });
        await Promise.all(orders.map((o) => enqueueOrderSync(o.id)));
        res.json({ message: "Orders sync enqueued", enqueued: orders.length });
    })
);

export default tallyRoutes;
