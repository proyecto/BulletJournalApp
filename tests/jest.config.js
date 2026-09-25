const path = require('path');

module.exports = {
  preset: 'jest-expo',
  rootDir: path.resolve(__dirname, '..'),
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/constants/**',
  ],
  moduleNameMapper: {
    '^react-native/setup-env$': '<rootDir>/tests/jest.setup-env.js',
  },
};
