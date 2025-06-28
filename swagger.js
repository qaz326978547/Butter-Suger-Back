const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Butter & Sugar',
    description: 'Description'
  },
  host: 'localhost:8080',  //host: 'butter-sugar.zeabur.app',
  schemes: ['https'],
  securityDefinitions: {
    BearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: '請填寫 Bearer token，例如: Bearer {token}'
    }
  },
  security: [{ BearerAuth: [] }],
};

const outputFile = './swagger-output.json';
const routes = ['./app.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);