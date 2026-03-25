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

describe("Auth Controller Tests", () => {
    let sandbox: SinonSandbox;
    let authController: any;
    let mockAuthService: any;

    const mockUser = { id: 1, name: "Test User", email: "test@example.com", role: "USER" };
    const mockToken = "mock.jwt.token";

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mockAuthService = {
            signupUser: sandbox.stub(),
            loginUser: sandbox.stub()
        };

        authController = await esmock("../../../src/controllers/auth.ts", {
            "../../../src/services/auth.service.ts": mockAuthService
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("signup", () => {
        it("should create a new user and return json", async () => {
            const req = createMockRequest({
                body: { name: "New User", email: "new@example.com", password: "testpassword", role: "USER" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockAuthService.signupUser.resolves(mockUser);

            await authController.signup(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal(mockUser);
        });

        it("should propagate BadRequestException when user already exists", async () => {
            const req = createMockRequest({
                body: { name: "Test", email: "test@example.com", password: "testpassword", role: "USER" }
            }) as Request;
            const res = createMockResponse() as Response;

            const { BadRequestException } = await import("../../../src/exceptions/bad-request.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockAuthService.signupUser.rejects(
                new BadRequestException("User already exists", ErrorCode.USER_ALREADY_EXISTS)
            );

            try {
                await authController.signup(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(400);
                expect(error.message).to.equal("User already exists");
            }
        });
    });

    describe("login", () => {
        it("should return user and token on successful login", async () => {
            const req = createMockRequest({
                body: { email: "test@example.com", password: "testpassword" }
            }) as Request;
            const res = createMockResponse() as Response;

            mockAuthService.loginUser.resolves({ user: mockUser, token: mockToken });

            await authController.login(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            const response = (res.json as SinonStub).firstCall.args[0];
            expect(response).to.have.property("user");
            expect(response).to.have.property("token");
        });

        it("should propagate NotFoundException when user not found", async () => {
            const req = createMockRequest({
                body: { email: "notfound@example.com", password: "testpassword" }
            }) as Request;
            const res = createMockResponse() as Response;

            const { NotFoundException } = await import("../../../src/exceptions/not-found.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockAuthService.loginUser.rejects(
                new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND)
            );

            try {
                await authController.login(req, res);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
            }
        });

        it("should propagate BadRequestException for incorrect password", async () => {
            const req = createMockRequest({
                body: { email: "test@example.com", password: "wrongpassword" }
            }) as Request;
            const res = createMockResponse() as Response;

            const { BadRequestException } = await import("../../../src/exceptions/bad-request.ts");
            const { ErrorCode } = await import("../../../src/exceptions/root.ts");
            mockAuthService.loginUser.rejects(
                new BadRequestException("Invalid password", ErrorCode.INCORRECT_PASSWORD)
            );

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
            const req = createMockRequest({ user: mockUser }) as Request;
            const res = createMockResponse() as Response;

            await authController.me(req, res);

            expect((res.json as SinonStub).calledOnce).to.be.true;
            expect((res.json as SinonStub).firstCall.args[0]).to.deep.equal({ user: mockUser });
        });
    });
});
