// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
const preprocessor = require('@badeball/cypress-cucumber-preprocessor');
const browserify = require('@badeball/cypress-cucumber-preprocessor/browserify');

// cucumber setup
async function setupNodeEvents(on, config) {
  await preprocessor.addCucumberPreprocessorPlugin(on, config);
  on('file:preprocessor', browserify.default(config));
  return config;
}

// default configurations
module.exports = defineConfig({
  projectId: 'b999ha',
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents,
    specPattern: ['cypress/e2e/features/*.feature'],
    experimentalMemoryManagement: true, // memory handling during the test execution
  },
  viewportHeight: 800,
  viewportWidth: 1500,
  defaultCommandTimeout: 60000,
  pageLoadTimeout: 60000,
  retries: {
    runMode: 1,
  },
  blockHosts: [
    '*clarity.ms',
    '*zendesk.com',
    '*pinterest.com',
    '*nr-data.net',
    '*zdassets.com',
    '*mczbf.com',
    // This is the server side GTM instance
    'a.visualcomfort.com',
    'a.circalighting.com',
    '*google-analytics.com',
    '*googletagmanager.com',
    '*bing.com',
    'cdn.cookielaw.org',
    'br.visualcomfort.com',
    // '*akamaihd.net', // VisualComfort section is not loading properly on the home page
  ],
  env: {
    retailUserEmail: 'test-cypress-retail@n8ko5unu.mailosaur.net',
    retailUserPassword: 'test#cypress#retail#n8ko5unu#mailosaur#net',
    tradeUserEmail: 'test-cypress-trade@n8ko5unu.mailosaur.net',
    tradeUserPassword: 'test#cypress#trade#n8ko5unu#mailosaur#net',
    wholesaleUserEmail: 'test-cypress-wholesale@n8ko5unu.mailosaur.net',
    wholesaleUserPassword: 'test#cypress#wholesale#n8ko5unu#mailosaur#net',
    country: 'US',
    US: {
      retailUserEmail: 'test-cypress-retail@n8ko5unu.mailosaur.net',
      retailUserPassword: 'test#cypress#retail#n8ko5unu#mailosaur#net',
      tradeUserEmail: 'test-cypress-trade@n8ko5unu.mailosaur.net',
      tradeUserPassword: 'test#cypress#trade#n8ko5unu#mailosaur#net',
      wholesaleUserEmail: 'test-cypress-wholesale@n8ko5unu.mailosaur.net',
      wholesaleUserPassword: 'test#cypress#wholesale#n8ko5unu#mailosaur#net',
      wholesaleUser2Email: 'test-qa1-wholesale@n8ko5unu.mailosaur.net',
      wholesaleUser2Password: 'QA1test2024',
    },
    UK: {
      retailUserEmail: 'test-cypress-retail-uk@n8ko5unu.mailosaur.net',
      retailUserPassword: 'Password123!',
      tradeUserEmail: 'tradeukqa@n8ko5unu.mailosaur.net',
      tradeUserPassword: 'Password123!',
      wholesaleUserEmail: 'test-cypress-wholesale-uk@n8ko5unu.mailosaur.net',
      wholesaleUserPassword: 'Password123!',
    },
    EU: {
      retailUserEmail: 'test-cypress-retail-eu@n8ko5unu.mailosaur.net',
      retailUserPassword: 'Password123!',
      tradeUserEmail: 'test-cypress-trade-eu@n8ko5unu.mailosaur.net',
      tradeUserPassword: 'Password123!',
      wholesaleUserEmail: 'test-cypress-wholesale-eu@n8ko5unu.mailosaur.net',
      wholesaleUserPassword: 'Password123!',
    },
  },
});
