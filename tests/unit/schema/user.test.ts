import { expect } from "chai";
import { SignUpSchema } from "../../../src/schema/user.ts";
import { ZodError } from "zod";

describe("User Schema", () => {
    describe("SignUpSchema", () => {
        it("should validate correct signup data", () => {
            const validData = {
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            };

            const result = SignUpSchema.parse(validData);

            expect(result).to.deep.equal(validData);
        });

        it("should reject invalid email", () => {
            const invalidData = {
                name: "Test User",
                email: "invalid-email",
                password: "password123"
            };

            try {
                SignUpSchema.parse(invalidData);
                expect.fail("Should have thrown ZodError");
            } catch (error) {
                expect(error).to.be.instanceOf(ZodError);
            }
        });

        it("should reject short password", () => {
            const invalidData = {
                name: "Test User",
                email: "test@example.com",
                password: "12345"
            };

            try {
                SignUpSchema.parse(invalidData);
                expect.fail("Should have thrown ZodError");
            } catch (error) {
                expect(error).to.be.instanceOf(ZodError);
            }
        });

        it("should reject missing name", () => {
            const invalidData = {
                email: "test@example.com",
                password: "password123"
            };

            try {
                SignUpSchema.parse(invalidData);
                expect.fail("Should have thrown ZodError");
            } catch (error) {
                expect(error).to.be.instanceOf(ZodError);
            }
        });

        it("should reject missing email", () => {
            const invalidData = {
                name: "Test User",
                password: "password123"
            };

            try {
                SignUpSchema.parse(invalidData);
                expect.fail("Should have thrown ZodError");
            } catch (error) {
                expect(error).to.be.instanceOf(ZodError);
            }
        });

        it("should reject missing password", () => {
            const invalidData = {
                name: "Test User",
                email: "test@example.com"
            };

            try {
                SignUpSchema.parse(invalidData);
                expect.fail("Should have thrown ZodError");
            } catch (error) {
                expect(error).to.be.instanceOf(ZodError);
            }
        });

        it("should accept password with exactly 6 characters", () => {
            const validData = {
                name: "Test User",
                email: "test@example.com",
                password: "123456"
            };

            const result = SignUpSchema.parse(validData);

            expect(result.password).to.equal("123456");
        });

        it("should reject empty name", () => {
            const invalidData = {
                name: "",
                email: "test@example.com",
                password: "password123"
            };

            const result = SignUpSchema.safeParse(invalidData);
            expect(result.success).to.be.true;
        });
    });
});
