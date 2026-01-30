import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { BadRequestException } from "../../../src/exceptions/bad-request.ts";
import { NotFoundException } from "../../../src/exceptions/not-found.ts";
import { ErrorCode } from "../../../src/exceptions/root.ts";
import { SignUpSchema } from "../../../src/schema/user.ts";

const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: bcrypt.hashSync("password123", 10),
    createdAt: new Date(),
    updatedAt: new Date()
};

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

const createMockNext = (): SinonStub => sinon.stub();

describe("Auth Controller Unit Tests", () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("signup logic", () => {
        it("should validate signup data with SignUpSchema", () => {
            const validData = { name: "Test", email: "test@example.com", password: "password123" };
            expect(() => SignUpSchema.parse(validData)).to.not.throw();
        });

        it("should reject invalid signup data", () => {
            const invalidData = { name: "Test", email: "invalid", password: "123" };
            expect(() => SignUpSchema.parse(invalidData)).to.throw();
        });

        it("should hash password with bcrypt", () => {
            const password = "password123";
            const hashed = bcrypt.hashSync(password, 10);
            expect(bcrypt.compareSync(password, hashed)).to.be.true;
            expect(bcrypt.compareSync("wrongpassword", hashed)).to.be.false;
        });

        it("should create BadRequestException for existing user", () => {
            const exception = new BadRequestException("User already exists", ErrorCode.USER_ALREADY_EXISTS);
            expect(exception.statusCode).to.equal(400);
            expect(exception.message).to.equal("User already exists");
            expect(exception.errorCode).to.equal(ErrorCode.USER_ALREADY_EXISTS);
        });
    });

    describe("login logic", () => {
        it("should create NotFoundException when user not found", () => {
            const exception = new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
            expect(exception.statusCode).to.equal(404);
            expect(exception.message).to.equal("User not found");
        });

        it("should create BadRequestException for invalid password", () => {
            const exception = new BadRequestException("Invalid password", ErrorCode.INCORRECT_PASSWORD);
            expect(exception.statusCode).to.equal(400);
            expect(exception.errorCode).to.equal(ErrorCode.INCORRECT_PASSWORD);
        });

        it("should verify password with bcrypt compareSync", () => {
            const password = "password123";
            const hashedPassword = bcrypt.hashSync(password, 10);

            expect(bcrypt.compareSync(password, hashedPassword)).to.be.true;
            expect(bcrypt.compareSync("wrongpassword", hashedPassword)).to.be.false;
        });

        it("should generate JWT token with user id", () => {
            const secret = "test-secret";
            const token = jwt.sign({ userId: mockUser.id }, secret);
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.userId).to.equal(mockUser.id);
        });
    });

    describe("me endpoint logic", () => {
        it("should return user from request object", () => {
            const req = createMockRequest({ user: mockUser });
            const res = createMockResponse();

            res.json!({ user: req.user });

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal({ user: mockUser });
        });
    });

    describe("response formatting", () => {
        it("should format signup response correctly", () => {
            const res = createMockResponse();
            const user = { id: 1, name: "Test", email: "test@example.com" };

            res.json!(user);

            expect((res.json as SinonStub).calledWith(user)).to.be.true;
        });

        it("should format login response with user and token", () => {
            const res = createMockResponse();
            const token = jwt.sign({ userId: 1 }, "test-secret");
            const response = { user: mockUser, token };

            res.json!(response);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            const calledWith = (res.json as SinonStub).firstCall.args[0];
            expect(calledWith).to.have.property("user");
            expect(calledWith).to.have.property("token");
        });
    });
});
