module.exports = {
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
