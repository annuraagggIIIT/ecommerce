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
    let mockProductService: any;
    let mockPrismaClient: any;
    const JWT_SECRET = TEST_JWT_SECRET;

    const mockAdminUser = { id: 1, name: "Admin User", email: "admin@example.com", role: "ADMIN" };
    const mockRegularUser = { id: 2, name: "Regular User", email: "user@example.com", role: "USER" };
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

        // Mock the service layer
        mockProductService = {
            createProduct: sandbox.stub(),
            updateProduct: sandbox.stub(),
            deleteProduct: sandbox.stub(),
            listProducts: sandbox.stub(),
            getProductById: sandbox.stub()
        };

        // Mock prisma for auth middleware simulation
        mockPrismaClient = {
            user: { findFirst: sandbox.stub() }
        };

        app = express();
        app.use(express.json());

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
            } catch {
                next(new UnauthorizedException("Invalid token", ErrorCode.UNAUTHORIZED));
            }
        };

        const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
            if (req.user?.role === "ADMIN") {
                next();
            } else {
                next(new UnauthorizedException("Unauthorized: Admins only", ErrorCode.UNAUTHORIZED));
            }
        };

        // Routes delegate to mock service (mirrors controller → service pattern)
        app.post("/api/products", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            const product = await mockProductService.createProduct(req.body);
            res.json(product);
        }));

        app.put("/api/products/:id", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            const product = await mockProductService.updateProduct(+req.params.id, req.body);
            res.json(product);
        }));

        app.delete("/api/products/:id", authMiddleware, adminMiddleware, errorHandler(async (req: Request, res: Response) => {
            const product = await mockProductService.deleteProduct(+req.params.id);
            res.json(product);
        }));

        app.get("/api/products", errorHandler(async (req: Request, res: Response) => {
            const products = await mockProductService.listProducts();
            res.json(products);
        }));

        app.get("/api/products/:id", errorHandler(async (req: Request, res: Response) => {
            const product = await mockProductService.getProductById(+req.params.id);
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
            mockProductService.createProduct.resolves(mockProduct);

            const response = await request(app)
                .post("/api/products")
                .set("Authorization", token)
                .send({ name: "Test Product", description: "A test product", price: 99.99, tags: ["electronics", "gadget"] })
                .expect(200);

            expect(response.body).to.have.property("id");
            expect(response.body.name).to.equal("Test Product");
        });

        it("should return 401 when no token provided", async () => {
            const response = await request(app)
                .post("/api/products")
                .send({ name: "Test Product", tags: ["electronics"] })
                .expect(401);
            expect(response.body.message).to.equal("No token provided");
        });

        it("should return 401 when user is not admin", async () => {
            const token = jwt.sign({ userId: 2 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockRegularUser);

            const response = await request(app)
                .post("/api/products")
                .set("Authorization", token)
                .send({ name: "Test Product", tags: ["electronics"] })
                .expect(401);
            expect(response.body.message).to.equal("Unauthorized: Admins only");
        });
    });

    describe("PUT /api/products/:id", () => {
        it("should update product when admin is authenticated", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockProductService.updateProduct.resolves({ ...mockProduct, name: "Updated Product" });

            const response = await request(app)
                .put("/api/products/1")
                .set("Authorization", token)
                .send({ name: "Updated Product", tags: ["updated"] })
                .expect(200);

            expect(response.body.name).to.equal("Updated Product");
        });

        it("should return 404 when product not found", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockProductService.updateProduct.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

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
            mockProductService.deleteProduct.resolves(mockProduct);

            const response = await request(app)
                .delete("/api/products/1")
                .set("Authorization", token)
                .expect(200);

            expect(response.body.id).to.equal(1);
        });

        it("should return 404 when product not found", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockAdminUser);
            mockProductService.deleteProduct.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

            const response = await request(app)
                .delete("/api/products/999")
                .set("Authorization", token)
                .expect(404);

            expect(response.body.message).to.equal("Product not found");
        });
    });

    describe("GET /api/products", () => {
        it("should return all products", async () => {
            mockProductService.listProducts.resolves([mockProduct]);

            const response = await request(app).get("/api/products").expect(200);

            expect(response.body).to.be.an("array");
            expect(response.body.length).to.equal(1);
        });

        it("should return empty array when no products", async () => {
            mockProductService.listProducts.resolves([]);

            const response = await request(app).get("/api/products").expect(200);

            expect(response.body).to.be.an("array").that.is.empty;
        });
    });

    describe("GET /api/products/:id", () => {
        it("should return product by id", async () => {
            mockProductService.getProductById.resolves(mockProduct);

            const response = await request(app).get("/api/products/1").expect(200);

            expect(response.body.id).to.equal(1);
            expect(response.body.name).to.equal("Test Product");
        });

        it("should return 404 when product not found", async () => {
            mockProductService.getProductById.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

            const response = await request(app).get("/api/products/999").expect(404);

            expect(response.body.message).to.equal("Product not found");
        });
    });
});
