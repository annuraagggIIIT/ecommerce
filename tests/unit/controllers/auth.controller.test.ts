import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import type { Request, Response, NextFunction } from "express";
import * as bcrypt from "bcrypt";
import esmock from "esmock";

const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword";
const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || "test-jwt-secret-for-local-dev";

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

describe("Auth Controller Tests", () => {
    let sandbox: SinonSandbox;
    let authController: any;
    let mockPrismaClient: any;

    const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: bcrypt.hashSync(TEST_PASSWORD, 10),
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            user: {
                findFirst: sandbox.stub(),
                create: sandbox.stub()
            }
        };

        // Use esmock to mock the prisma module
        authController = await esmock("../../../src/controllers/auth.ts", {
            "../../../src/db/prisma.ts": {
                prismaClient: mockPrismaClient
            },
            "../../../src/secrets.ts": {
                JWT_SECRET: TEST_JWT_SECRET
            }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("signup", () => {
        it("should create a new user successfully", async () => {
            const req = createMockRequest({
                body: {
                    name: "New User",
                    email: "new@example.com",
                    password: TEST_PASSWORD,
                    role: "USER"
                }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            mockPrismaClient.user.findFirst.resolves(null);
            mockPrismaClient.user.create.resolves({
                id: 2,
                name: "New User",
                email: "new@example.com",
                role: "USER"
            });

            await authController.signup(req, res, next);

            expect((res.json as SinonStub).calledOnce).to.be.true;
        });

        it("should call next with BadRequestException when user exists", async () => {
            const req = createMockRequest({
                body: {
                    name: "Test User",
                    email: "test@example.com",
                    password: TEST_PASSWORD,
                    role: "USER"
                }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            mockPrismaClient.user.findFirst.resolves(mockUser);
            mockPrismaClient.user.create.resolves(mockUser);

            await authController.signup(req, res, next);

            expect(next.calledOnce).to.be.true;
        });
    });

    describe("login", () => {
        it("should login successfully with valid credentials", async () => {
            const req = createMockRequest({
                body: {
                    email: "test@example.com",
                    password: TEST_PASSWORD
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.user.findFirst.resolves(mockUser);

            await authController.login(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            const response = (res.json as SinonStub).firstCall.args[0];
            expect(response).to.have.property("user");
            expect(response).to.have.property("token");
        });

        it("should throw NotFoundException when user not found", async () => {
            const req = createMockRequest({
                body: {
                    email: "notfound@example.com",
                    password: TEST_PASSWORD
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.user.findFirst.resolves(null);

            try {
                await authController.login(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });

        it("should throw BadRequestException for incorrect password", async () => {
            const req = createMockRequest({
                body: {
                    email: "test@example.com",
                    password: "wrongpassword"
                }
            }) as Request;
            const res = createMockResponse() as Response;

            mockPrismaClient.user.findFirst.resolves(mockUser);

            try {
                await authController.login(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(400);
            }
        });
    });

    describe("me", () => {
        it("should return user from request object", async () => {
            const req = createMockRequest({
                user: mockUser
            }) as Request;
            const res = createMockResponse() as Response;

            await authController.me(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal({ user: mockUser });
        });
    });
});
