module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'import/extensions': ['error', {
      js: 'always',
    }],
    'no-underscore-dangle': 'off',
    // Add exception for Cypress and test files
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.test.js',
        '**/*.spec.js',
        '**/cypress.config.js',
        '**/cypress/**/*.js',
      ],
    }],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@badeball/cypress-cucumber-preprocessor/browserify', './node_modules/@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/browserify.d.ts'],
        ],
      },
    },
  },
};
