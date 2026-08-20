import type { Config } from "jest";

const config: Config = {
    testEnvironment: "node",
    rootDir: ".",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    testMatch: ["**/?(*.)+(test).ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "<rootDir>/tsconfig.test.json",
            },
        ],
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    extensionsToTreatAsEsm: [".ts"],
    testTimeout: 30_000,
    detectOpenHandles: false,
    forceExit: true,
    verbose: true,
};

export default config;
