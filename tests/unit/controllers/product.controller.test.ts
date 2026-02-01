import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import type { Request, Response } from "express";
import esmock from "esmock";

const createMockRequest = (overrides: any = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
});

const createMockResponse = (): Partial<Response> => {
    const res: any = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    res.send = sinon.stub().returns(res);
    return res;
};

describe("Product Controller Tests", () => {
    let sandbox: SinonSandbox;
    let productController: any;
    let mockPrismaClient: any;

    const mockProduct = {
        id: 1,
        name: "Test Product",
        description: "A test product",
        price: 99.99,
        tags: "electronics,gadget",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            product: {
                create: sandbox.stub(),
                update: sandbox.stub(),
                delete: sandbox.stub(),
                findMany: sandbox.stub(),
                findFirst: sandbox.stub()
            }
        };

        productController = await esmock("../../../src/controllers/product.ts", {
            "../../../src/db/prisma.ts": {
                prismaClient: mockPrismaClient
            }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("createProduct", () => {
        it("should create a product successfully", async () => {
            const req = createMockRequest({
                body: {
                    name: "Test Product",
                    description: "A test product",
                    price: 99.99,
                    tags: ["electronics", "gadget"]
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.create.resolves(mockProduct);

            await productController.createProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });
    });

    describe("updateProduct", () => {
        it("should update a product with tags successfully", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                body: {
                    name: "Updated Product",
                    tags: ["updated"]
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.update.resolves({ ...mockProduct, name: "Updated Product" });

            await productController.updateProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should update product without tags", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                body: {
                    name: "Updated Product"
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.update.resolves({ ...mockProduct, name: "Updated Product" });

            await productController.updateProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should throw NotFoundException when product not found", async () => {
            const req = createMockRequest({
                params: { id: "999" },
                body: { name: "Updated" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.update.rejects(new Error("Not found"));

            try {
                await productController.updateProduct(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("deleteProduct", () => {
        it("should delete a product successfully", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                body: {}
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.delete.resolves(mockProduct);

            await productController.deleteProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should throw NotFoundException when product not found", async () => {
            const req = createMockRequest({
                params: { id: "999" },
                body: {}
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.delete.rejects(new Error("Not found"));

            try {
                await productController.deleteProduct(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("listProducts", () => {
        it("should list all products successfully", async () => {
            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.findMany.resolves([mockProduct]);

            await productController.listProducts(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should throw NotFoundException on error", async () => {
            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.findMany.rejects(new Error("Database error"));

            try {
                await productController.listProducts(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("getProductById", () => {
        it("should get a product by id successfully", async () => {
            const req = createMockRequest({
                params: { id: "1" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.findFirst.resolves(mockProduct);

            await productController.getProductById(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should throw NotFoundException when product is null", async () => {
            const req = createMockRequest({
                params: { id: "999" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.findFirst.resolves(null);

            try {
                await productController.getProductById(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });

        it("should throw NotFoundException on database error", async () => {
            const req = createMockRequest({
                params: { id: "1" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.product.findFirst.rejects(new Error("Database error"));

            try {
                await productController.getProductById(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });
});
