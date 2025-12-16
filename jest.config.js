const { createCjsPreset } = require('jest-preset-angular/presets');
const esModules = [].join('|');

module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/app'],

  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        allowSyntheticDefaultImports: true,
      },
    ],
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/setup-jest.ts'
  ]
};
