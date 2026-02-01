import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorMiddleware } from "../../src/middlewares/errors.ts";
import { errorHandler } from "../../src/error-handler.ts";
import { NotFoundException } from "../../src/exceptions/not-found.ts";
import { UnauthorizedException } from "../../src/exceptions/unauthorized.ts";
import { ErrorCode } from "../../src/exceptions/root.ts";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || "test-jwt-secret";

describe("Product Integration Tests", () => {
    let sandbox: SinonSandbox;
    let app: Express;
    let mockPrismaClient: any;
    const JWT_SECRET = TEST_JWT_SECRET;

    const mockAdminUser = {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockRegularUser = {
        id: 2,
        name: "Regular User",
        email: "user@example.com",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockProduct = {
        id: 1,
        name: "Test Product",
        description: "A test product",
        price: 99.99,
        tags: "electronics,gadget",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            user: {
                findFirst: sandbox.stub()
            },
            product: {
                create: sandbox.stub(),
                update: sandbox.stub(),
                delete: sandbox.stub(),
                findMany: sandbox.stub(),
                findFirst: sandbox.stub()
            }
        };

        app = express();
        app.use(express.json());

        // Auth middleware simulation
        const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
            const token = req.headers.authorization;
            if (!token) {
                next(new UnauthorizedException("No token provided", ErrorCode.UNAUTHORIZED));
                return;
            }
            try {
                const payload = jwt.verify(token, JWT_SECRET) as any;
                const user = await mockPrismaClient.user.findFirst({ where: { id: payload.userId } });
                if (!user) {
                    next(new UnauthorizedException("User not found", ErrorCode.UNAUTHORIZED));
                    return;
                }
                req.user = user;
                next();
            } catch (error) {
                next(new UnauthorizedException("Invalid token", ErrorCode.UNAUTHORIZED));
            }
        };

        // Admin middleware simulation
        const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
            const user = req.user;
            if (user && user.role === "ADMIN") {
                next();
            } else {
                next(new UnauthorizedException("Unauthorized: Admins only", ErrorCode.UNAUTHORIZED));
            }
        };

        // Product routes
        app.post("/api/products", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            const product = await mockPrismaClient.product.create({
                data: {
                    ...req.body,
                    tags: req.body.tags.join(",")
                }
            });
            res.json(product);
        }));

        app.put("/api/products/:id", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            try {
                const product = req.body;
                if (product.tags) {
                    product.tags = product.tags.join(",");
                }
                const updatedProduct = await mockPrismaClient.product.update({
                    where: { id: +req.params.id },
                    data: product
                });
                res.json(updatedProduct);
            } catch (err) {
                throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
            }
        }));

        app.delete("/api/products/:id", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            try {
                const deletedProduct = await mockPrismaClient.product.delete({
                    where: { id: +req.params.id }
                });
                res.json(deletedProduct);
            } catch (err) {
                throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
            }
        }));

        app.get("/api/products", errorHandler(async (req: Request, res: Response) => {
            const products = await mockPrismaClient.product.findMany();
            res.json(products);
        }));

        app.get("/api/products/:id", errorHandler(async (req: Request, res: Response) => {
            const product = await mockPrismaClient.product.findFirst({
                where: { id: +req.params.id }
            });
            if (!product) {
                throw new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
            }
            res.json(product);
        }));

        app.use(errorMiddleware);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("POST /api/products", () => {
        it("should create product when admin is authenticated", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockPrismaClient.product.create.resolves(mockProduct);

            const response = await request(app)
                .post("/api/products")
                .set("Authorization", token)
                .send({
                    name: "Test Product",
                    description: "A test product",
                    price: 99.99,
                    tags: ["electronics", "gadget"]
                })
                .expect(200);

            expect(response.body).to.have.property("id");
            expect(response.body.name).to.equal("Test Product");
        });

        it("should return 401 when no token provided", async () => {
            const response = await request(app)
                .post("/api/products")
                .send({
                    name: "Test Product",
                    description: "A test product",
                    price: 99.99,
                    tags: ["electronics"]
                })
                .expect(401);

            expect(response.body.message).to.equal("No token provided");
        });

        it("should return 401 when user is not admin", async () => {
            const token = jwt.sign({ userId: 2 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockRegularUser);

            const response = await request(app)
                .post("/api/products")
                .set("Authorization", token)
                .send({
                    name: "Test Product",
                    description: "A test product",
                    price: 99.99,
                    tags: ["electronics"]
                })
                .expect(401);

            expect(response.body.message).to.equal("Unauthorized: Admins only");
        });
    });

    describe("PUT /api/products/:id", () => {
        it("should update product when admin is authenticated", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockPrismaClient.product.update.resolves({ ...mockProduct, name: "Updated Product" });

            const response = await request(app)
                .put("/api/products/1")
                .set("Authorization", token)
                .send({
                    name: "Updated Product",
                    tags: ["updated"]
                })
                .expect(200);

            expect(response.body.name).to.equal("Updated Product");
        });

        it("should return 404 when product not found", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockPrismaClient.product.update.rejects(new Error("Not found"));

            const response = await request(app)
                .put("/api/products/999")
                .set("Authorization", token)
                .send({ name: "Updated" })
                .expect(404);

            expect(response.body.message).to.equal("Product not found");
        });
    });

    describe("DELETE /api/products/:id", () => {
        it("should delete product when admin is authenticated", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockPrismaClient.product.delete.resolves(mockProduct);

            const response = await request(app)
                .delete("/api/products/1")
                .set("Authorization", token)
                .expect(200);

            expect(response.body.id).to.equal(1);
        });

        it("should return 404 when product not found", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockPrismaClient.product.delete.rejects(new Error("Not found"));

            const response = await request(app)
                .delete("/api/products/999")
                .set("Authorization", token)
                .expect(404);

            expect(response.body.message).to.equal("Product not found");
        });
    });

    describe("GET /api/products", () => {
        it("should return all products", async () => {
            mockPrismaClient.product.findMany.resolves([mockProduct]);

            const response = await request(app)
                .get("/api/products")
                .expect(200);

            expect(response.body).to.be.an("array");
            expect(response.body.length).to.equal(1);
        });

        it("should return empty array when no products", async () => {
            mockPrismaClient.product.findMany.resolves([]);

            const response = await request(app)
                .get("/api/products")
                .expect(200);

            expect(response.body).to.be.an("array");
            expect(response.body.length).to.equal(0);
        });
    });

    describe("GET /api/products/:id", () => {
        it("should return product by id", async () => {
            mockPrismaClient.product.findFirst.resolves(mockProduct);

            const response = await request(app)
                .get("/api/products/1")
                .expect(200);

            expect(response.body.id).to.equal(1);
            expect(response.body.name).to.equal("Test Product");
        });

        it("should return 404 when product not found", async () => {
            mockPrismaClient.product.findFirst.resolves(null);

            const response = await request(app)
                .get("/api/products/999")
                .expect(404);

            expect(response.body.message).to.equal("Product not found");
        });
    });
});
