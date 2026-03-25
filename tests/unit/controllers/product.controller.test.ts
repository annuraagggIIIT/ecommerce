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
    let mockProductService: any;

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

        mockProductService = {
            createProduct: sandbox.stub(),
            updateProduct: sandbox.stub(),
            deleteProduct: sandbox.stub(),
            listProducts: sandbox.stub(),
            getProductById: sandbox.stub()
        };

        productController = await esmock("../../../src/controllers/product.ts", {
            "../../../src/services/product.service.ts": mockProductService
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("createProduct", () => {
        it("should create a product and return json", async () => {
            const req = createMockRequest({
                body: { name: "Test Product", description: "A test product", price: 99.99, tags: ["electronics", "gadget"] }
            }) as Request;
            const res = createMockResponse() as Response;

            mockProductService.createProduct.resolves(mockProduct);

            await productController.createProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal(mockProduct);
        });
    });

    describe("updateProduct", () => {
        it("should update a product and return json", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                body: { name: "Updated Product", tags: ["updated"] }
            }) as Request;
            const res = createMockResponse() as Response;

            const updated = { ...mockProduct, name: "Updated Product" };
            mockProductService.updateProduct.resolves(updated);

            await productController.updateProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect(mockProductService.updateProduct.calledWith(1, req.body)).to.be.true;
        });

        it("should propagate NotFoundException when product not found", async () => {
            const req = createMockRequest({ params: { id: "999" }, body: { name: "Updated" } }) as Request;
            const res = createMockResponse() as Response;

            const { NotFoundException } = await import("../../../src/exceptions/not-found.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockProductService.updateProduct.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

            try {
                await productController.updateProduct(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("deleteProduct", () => {
        it("should delete a product and return json", async () => {
            const req = createMockRequest({ params: { id: "1" } }) as Request;
            const res = createMockResponse() as Response;

            mockProductService.deleteProduct.resolves(mockProduct);

            await productController.deleteProduct(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect(mockProductService.deleteProduct.calledWith(1)).to.be.true;
        });

        it("should propagate NotFoundException when product not found", async () => {
            const req = createMockRequest({ params: { id: "999" } }) as Request;
            const res = createMockResponse() as Response;

            const { NotFoundException } = await import("../../../src/exceptions/not-found.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockProductService.deleteProduct.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

            try {
                await productController.deleteProduct(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("listProducts", () => {
        it("should return all products from service", async () => {
            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;

            mockProductService.listProducts.resolves([mockProduct]);

            await productController.listProducts(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal([mockProduct]);
        });
    });

    describe("getProductById", () => {
        it("should return a product by id", async () => {
            const req = createMockRequest({ params: { id: "1" } }) as Request;
            const res = createMockResponse() as Response;

            mockProductService.getProductById.resolves(mockProduct);

            await productController.getProductById(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect(mockProductService.getProductById.calledWith(1)).to.be.true;
        });

        it("should propagate NotFoundException when product not found", async () => {
            const req = createMockRequest({ params: { id: "999" } }) as Request;
            const res = createMockResponse() as Response;

            const { NotFoundException } = await import("../../../src/exceptions/not-found.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockProductService.getProductById.rejects(
                new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND)
            );

            try {
                await productController.getProductById(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });
});
