import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    // Path to your Next.js app — loads next.config.mjs + .env files
    dir: "./",
});

/** @type {import('jest').Config} */
const config = {
    // Default environment for component tests
    testEnvironment: "jsdom",

    // Load jest-dom matchers globally
    setupFilesAfterEnv: ["./jest.setup.js"],

    // Where to find tests
    testMatch: ["**/__tests__/**/*.(test|spec).(js|jsx)"],

    // Path alias to match Next.js "@/" imports
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};

export default createJestConfig(config);
