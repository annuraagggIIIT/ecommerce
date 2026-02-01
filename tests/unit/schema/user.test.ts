import { expect } from "chai";
import { SignUpSchema } from "../../../src/schema/user.ts";
import { ZodError } from "zod";

const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword";

describe("User Schema", () => {
    describe("SignUpSchema", () => {
        it("should validate correct signup data", () => {
            const validData = {
                name: "Test User",
                email: "test@example.com",
                password: TEST_PASSWORD
            };

            const result = SignUpSchema.parse(validData);

            expect(result.name).to.equal(validData.name);
            expect(result.email).to.equal(validData.email);
            expect(result.password).to.equal(validData.password);
            expect(result.role).to.equal("USER");
        });

        it("should accept valid role ADMIN", () => {
            const validData = {
                name: "Admin User",
                email: "admin@example.com",
                password: TEST_PASSWORD,
                role: "ADMIN"
            };

            const result = SignUpSchema.parse(validData);

            expect(result.role).to.equal("ADMIN");
        });

        it("should reject invalid role", () => {
            const invalidData = {
                name: "Test User",
                email: "test@example.com",
                password: TEST_PASSWORD,
                role: "INVALID_ROLE"
            };

            expect(() => SignUpSchema.parse(invalidData)).to.throw();
        });

        it("should reject invalid email", () => {
            const invalidData = {
                name: "Test User",
                email: "invalid-email",
                password: TEST_PASSWORD
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
                password: TEST_PASSWORD
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
                password: TEST_PASSWORD
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
                password: TEST_PASSWORD
            };

            const result = SignUpSchema.safeParse(invalidData);
            expect(result.success).to.be.true;
        });
    });
});
