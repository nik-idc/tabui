const { availableParallelism } = require("node:os");

module.exports = {
  // More workers repeatedly cost time on local cold and warm transform caches.
  // Keep smaller machines bounded; Jest's CLI --maxWorkers still overrides this.
  maxWorkers: Math.max(1, Math.min(4, availableParallelism() - 1)),
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@atikincode/tabui$": "<rootDir>/src/index.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
