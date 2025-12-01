// jest.config.cjs
module.exports = {
    roots: ['<rootDir>/src'],
    testEnvironment: "node",
    setupFiles: ['fake-indexeddb/auto'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true
            }
        ],
    },
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    testMatch: ['**/src/indexeddb/**/*.spec.ts']
};