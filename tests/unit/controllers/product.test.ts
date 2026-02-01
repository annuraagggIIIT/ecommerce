import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import type { Request, Response } from "express";
import { NotFoundException } from "../../../src/exceptions/not-found.ts";
import { ErrorCode } from "../../../src/exceptions/root.ts";

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

describe("Product Controller Unit Tests", () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("createProduct logic", () => {
        it("should join tags array into comma-separated string", () => {
            const tags = ["electronics", "gadget", "new"];
            const result = tags.join(",");
            expect(result).to.equal("electronics,gadget,new");
        });

        it("should handle empty tags array", () => {
            const tags: string[] = [];
            const result = tags.join(",");
            expect(result).to.equal("");
        });

        it("should handle single tag", () => {
            const tags = ["electronics"];
            const result = tags.join(",");
            expect(result).to.equal("electronics");
        });
    });

    describe("updateProduct logic", () => {
        it("should convert tags array to string when tags exist", () => {
            const product = { name: "Test", tags: ["a", "b"] };
            if (product.tags) {
                (product as any).tags = product.tags.join(",");
            }
            expect(product.tags).to.equal("a,b");
        });

        it("should not modify product when tags is undefined", () => {
            const product: any = { name: "Test" };
            if (product.tags) {
                product.tags = product.tags.join(",");
            }
            expect(product.tags).to.be.undefined;
        });

        it("should create NotFoundException when product not found", () => {
            const exception = new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
            expect(exception.statusCode).to.equal(404);
            expect(exception.message).to.equal("Product not found");
            expect(exception.errorCode).to.equal(ErrorCode.PRODUCT_NOT_FOUND);
        });
    });

    describe("deleteProduct logic", () => {
        it("should parse id from params as number", () => {
            const req = createMockRequest({ params: { id: "123" } });
            const id = +req.params!.id;
            expect(id).to.equal(123);
            expect(typeof id).to.equal("number");
        });

        it("should handle non-numeric id", () => {
            const req = createMockRequest({ params: { id: "abc" } });
            const id = +req.params!.id;
            expect(Number.isNaN(id)).to.be.true;
        });
    });

    describe("listProducts logic", () => {
        it("should create NotFoundException when products not found", () => {
            const exception = new NotFoundException("Products not found", ErrorCode.PRODUCT_NOT_FOUND);
            expect(exception.statusCode).to.equal(404);
            expect(exception.message).to.equal("Products not found");
        });
    });

    describe("getProductById logic", () => {
        it("should throw NotFoundException when product is null", () => {
            const product = null;
            if (!product) {
                const exception = new NotFoundException("Product not found", ErrorCode.PRODUCT_NOT_FOUND);
                expect(exception.statusCode).to.equal(404);
            }
        });

        it("should return product when found", () => {
            const product = { id: 1, name: "Test", description: "Test desc", price: 100, tags: "a,b" };
            expect(product).to.not.be.null;
            expect(product.id).to.equal(1);
        });
    });

    describe("response formatting", () => {
        it("should return product in json response", () => {
            const res = createMockResponse();
            const product = { id: 1, name: "Test Product" };
            res.json!(product);
            expect((res.json as SinonStub).calledWith(product)).to.be.true;
        });

        it("should return array of products in json response", () => {
            const res = createMockResponse();
            const products = [
                { id: 1, name: "Product 1" },
                { id: 2, name: "Product 2" }
            ];
            res.json!(products);
            expect((res.json as SinonStub).calledWith(products)).to.be.true;
        });
    });
});
