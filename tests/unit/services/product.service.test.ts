import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import esmock from "esmock";

describe("Product Service Tests", () => {
    let sandbox: SinonSandbox;
    let productService: any;
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

        productService = await esmock("../../../src/services/product.service.ts", {
            "../../../src/db/prisma.ts": { prismaClient: mockPrismaClient }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("createProduct", () => {
        it("should join tags array into comma-separated string", async () => {
            mockPrismaClient.product.create.resolves(mockProduct);

            await productService.createProduct({ name: "Test", description: "Desc", price: 10, tags: ["a", "b"] });

            const createArg = mockPrismaClient.product.create.firstCall.args[0];
            expect(createArg.data.tags).to.equal("a,b");
        });

        it("should pass through tags if already a string", async () => {
            mockPrismaClient.product.create.resolves(mockProduct);

            await productService.createProduct({ name: "Test", tags: "a,b" });

            const createArg = mockPrismaClient.product.create.firstCall.args[0];
            expect(createArg.data.tags).to.equal("a,b");
        });

        it("should return the created product", async () => {
            mockPrismaClient.product.create.resolves(mockProduct);

            const result = await productService.createProduct({ name: "Test", tags: ["electronics"] });

            expect(result).to.deep.equal(mockProduct);
        });
    });

    describe("updateProduct", () => {
        it("should update a product successfully", async () => {
            const updated = { ...mockProduct, name: "Updated" };
            mockPrismaClient.product.update.resolves(updated);

            const result = await productService.updateProduct(1, { name: "Updated" });

            expect(result).to.deep.equal(updated);
            expect(mockPrismaClient.product.update.calledOnce).to.be.true;
        });

        it("should convert tags array to string on update", async () => {
            mockPrismaClient.product.update.resolves(mockProduct);

            await productService.updateProduct(1, { tags: ["new", "tag"] });

            const updateArg = mockPrismaClient.product.update.firstCall.args[0];
            expect(updateArg.data.tags).to.equal("new,tag");
        });

        it("should throw NotFoundException when product does not exist", async () => {
            mockPrismaClient.product.update.rejects(new Error("Record not found"));

            try {
                await productService.updateProduct(999, { name: "X" });
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
                expect(error.message).to.equal("Product not found");
            }
        });
    });

    describe("deleteProduct", () => {
        it("should delete a product successfully", async () => {
            mockPrismaClient.product.delete.resolves(mockProduct);

            const result = await productService.deleteProduct(1);

            expect(result).to.deep.equal(mockProduct);
            expect(mockPrismaClient.product.delete.calledWith({ where: { id: 1 } })).to.be.true;
        });

        it("should throw NotFoundException when product does not exist", async () => {
            mockPrismaClient.product.delete.rejects(new Error("Record not found"));

            try {
                await productService.deleteProduct(999);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe("listProducts", () => {
        it("should return all products", async () => {
            mockPrismaClient.product.findMany.resolves([mockProduct]);

            const result = await productService.listProducts();

            expect(result).to.deep.equal([mockProduct]);
        });

        it("should return empty array when no products exist", async () => {
            mockPrismaClient.product.findMany.resolves([]);

            const result = await productService.listProducts();

            expect(result).to.be.an("array").that.is.empty;
        });
    });

    describe("getProductById", () => {
        it("should return a product by id", async () => {
            mockPrismaClient.product.findFirst.resolves(mockProduct);

            const result = await productService.getProductById(1);

            expect(result).to.deep.equal(mockProduct);
            expect(mockPrismaClient.product.findFirst.calledWith({ where: { id: 1 } })).to.be.true;
        });

        it("should throw NotFoundException when product is null", async () => {
            mockPrismaClient.product.findFirst.resolves(null);

            try {
                await productService.getProductById(999);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
                expect(error.message).to.equal("Product not found");
            }
        });
    });
});
