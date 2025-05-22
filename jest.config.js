module.exports = {
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "packages"],
  moduleNameMapper: {
    "^oregion$": "<rootDir>/packages/oregion/index.js",
    "^oregion-dom$": "<rootDir>/packages/oregion-dom/index.js",
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testMatch: ["**/__tests__/**/*.test.js"],
};
