module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  globals: {
    'ts-jest': {
      tsConfigFile: 'tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
