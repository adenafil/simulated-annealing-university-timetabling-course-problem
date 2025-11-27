/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.spec.ts"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index-old.ts",
    "!src/examples/**",
    "!src/**/*.d.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 45,
      lines: 29,
      statements: 29
    }
  }
};
