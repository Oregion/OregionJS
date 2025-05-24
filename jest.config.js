module.exports = {
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "packages"],
  moduleNameMapper: {
    "^zepsh$": "<rootDir>/packages/zepsh/index.js",
    "^zepsh-dom$": "<rootDir>/packages/zepsh-dom/index.js",
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testMatch: ["**/__tests__/**/*.test.js"],
};
