import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { errorMiddleware } from "../../src/middlewares/errors.ts";
import { BadRequestException } from "../../src/exceptions/bad-request.ts";
import { NotFoundException } from "../../src/exceptions/not-found.ts";
import { UnauthorizedException } from "../../src/exceptions/unauthorized.ts";
import { InternalException } from "../../src/exceptions/internal-exception.ts";
import { ErrorCode } from "../../src/exceptions/root.ts";
import { errorHandler } from "../../src/error-handler.ts";

describe("Middleware Integration Tests", () => {
    let sandbox: SinonSandbox;
    let app: Express;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        app = express();
        app.use(express.json());
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Error Middleware Chain", () => {
        it("should handle BadRequestException correctly", async () => {
            app.get("/test", (req: Request, res: Response, next: NextFunction) => {
                next(new BadRequestException("Bad request error", ErrorCode.USER_ALREADY_EXISTS));
            });
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(400);

            expect(response.body.message).to.equal("Bad request error");
            expect(response.body.errorCode).to.equal(ErrorCode.USER_ALREADY_EXISTS);
        });

        it("should handle NotFoundException correctly", async () => {
            app.get("/test", (req: Request, res: Response, next: NextFunction) => {
                next(new NotFoundException("Resource not found", ErrorCode.USER_NOT_FOUND));
            });
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(404);

            expect(response.body.message).to.equal("Resource not found");
            expect(response.body.errorCode).to.equal(ErrorCode.USER_NOT_FOUND);
        });

        it("should handle UnauthorizedException correctly", async () => {
            app.get("/test", (req: Request, res: Response, next: NextFunction) => {
                next(new UnauthorizedException("Not authorized", ErrorCode.UNAUTHORIZED));
            });
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(401);

            expect(response.body.message).to.equal("Not authorized");
            expect(response.body.errorCode).to.equal(ErrorCode.UNAUTHORIZED);
        });

        it("should handle InternalException correctly", async () => {
            const originalError = new Error("Database error");
            app.get("/test", (req: Request, res: Response, next: NextFunction) => {
                next(new InternalException("Internal server error", originalError, ErrorCode.INRERNAL_EXCEPTION));
            });
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(500);

            expect(response.body.message).to.equal("Internal server error");
            expect(response.body.errorCode).to.equal(ErrorCode.INRERNAL_EXCEPTION);
        });
    });

    describe("Error Handler Wrapper Integration", () => {
        it("should wrap async errors and pass to error middleware", async () => {
            const asyncHandler = async (req: Request, res: Response) => {
                throw new BadRequestException("Async error", ErrorCode.USER_ALREADY_EXISTS);
            };

            app.get("/test", errorHandler(asyncHandler));
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(400);

            expect(response.body.message).to.equal("Async error");
        });

        it("should wrap non-HttpException in InternalException", async () => {
            const asyncHandler = async (req: Request, res: Response) => {
                throw new Error("Unexpected error");
            };

            app.get("/test", errorHandler(asyncHandler));
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(500);

            expect(response.body.message).to.equal("Internal Server Error");
            expect(response.body.errorCode).to.equal(ErrorCode.INRERNAL_EXCEPTION);
        });

        it("should pass successful responses through", async () => {
            const asyncHandler = async (req: Request, res: Response) => {
                res.json({ success: true });
            };

            app.get("/test", errorHandler(asyncHandler));
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });
        });
    });

    describe("Multiple Middleware Chain", () => {
        it("should pass through multiple middlewares successfully", async () => {
            const middleware1 = (req: Request, res: Response, next: NextFunction) => {
                (req as any).step1 = true;
                next();
            };

            const middleware2 = (req: Request, res: Response, next: NextFunction) => {
                (req as any).step2 = true;
                next();
            };

            app.get("/test", middleware1, middleware2, (req: Request, res: Response) => {
                res.json({
                    step1: (req as any).step1,
                    step2: (req as any).step2
                });
            });

            const response = await request(app)
                .get("/test")
                .expect(200);

            expect(response.body.step1).to.be.true;
            expect(response.body.step2).to.be.true;
        });

        it("should stop chain when middleware calls next with error", async () => {
            const middleware1 = (req: Request, res: Response, next: NextFunction) => {
                next(new BadRequestException("Stopped at middleware1", ErrorCode.VALIDATION_ERROR));
            };

            const middleware2 = sandbox.stub().callsFake((req: Request, res: Response, next: NextFunction) => {
                next();
            });

            app.get("/test", middleware1, middleware2, (req: Request, res: Response) => {
                res.json({ success: true });
            });
            app.use(errorMiddleware);

            const response = await request(app)
                .get("/test")
                .expect(400);

            expect(response.body.message).to.equal("Stopped at middleware1");
            expect(middleware2.called).to.be.false;
        });
    });

    describe("Request Body Parsing", () => {
        it("should parse JSON request body", async () => {
            app.post("/test", (req: Request, res: Response) => {
                res.json({ received: req.body });
            });

            const response = await request(app)
                .post("/test")
                .send({ name: "test", value: 123 })
                .expect(200);

            expect(response.body.received).to.deep.equal({ name: "test", value: 123 });
        });

        it("should handle empty request body", async () => {
            app.post("/test", (req: Request, res: Response) => {
                res.json({ received: req.body });
            });

            const response = await request(app)
                .post("/test")
                .send({})
                .expect(200);

            expect(response.body.received).to.deep.equal({});
        });
    });

    describe("Response Status Codes", () => {
        it("should return 200 for successful GET request", async () => {
            app.get("/test", (req: Request, res: Response) => {
                res.json({ success: true });
            });

            await request(app).get("/test").expect(200);
        });

        it("should return 201 when explicitly set", async () => {
            app.post("/test", (req: Request, res: Response) => {
                res.status(201).json({ created: true });
            });

            const response = await request(app)
                .post("/test")
                .expect(201);

            expect(response.body.created).to.be.true;
        });
    });
});
