/**
 * @jest-environment node
 */

import { signToken, verifyToken } from "@/lib/jwt";

// Set a test JWT secret before running
beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-for-jest";
});

describe("JWT Utilities", () => {
    const testPayload = {
        id: "abc123",
        name: "Test User",
        rollNumber: "22CS001",
    };

    describe("signToken", () => {
        it("returns a string token", () => {
            const token = signToken(testPayload);
            expect(typeof token).toBe("string");
            expect(token.length).toBeGreaterThan(0);
        });

        it("produces a JWT with three dot-separated parts", () => {
            const token = signToken(testPayload);
            const parts = token.split(".");
            expect(parts).toHaveLength(3); // header.payload.signature
        });
    });

    describe("verifyToken", () => {
        it("successfully verifies a valid token and returns the payload", () => {
            const token = signToken(testPayload);
            const decoded = verifyToken(token);

            expect(decoded.id).toBe(testPayload.id);
            expect(decoded.name).toBe(testPayload.name);
            expect(decoded.rollNumber).toBe(testPayload.rollNumber);
        });

        it("includes iat and exp claims in the decoded payload", () => {
            const token = signToken(testPayload);
            const decoded = verifyToken(token);

            expect(decoded).toHaveProperty("iat");
            expect(decoded).toHaveProperty("exp");
        });

        it("throws an error for a tampered token", () => {
            const token = signToken(testPayload);
            const tamperedToken = token + "tampered";

            expect(() => verifyToken(tamperedToken)).toThrow();
        });

        it("throws an error for a completely invalid token", () => {
            expect(() => verifyToken("not.a.valid.token")).toThrow();
        });
    });
});
