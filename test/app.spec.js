/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const request = require('supertest');

describe('API', function () {
  let server;
  before(() => {
    server = require('../src/index');
  });
  after(() => {
    server.close();
  });

  it('GET /', async () => {
    await request(server)
      .get('/')
      .expect((res) => {
        expect(res.body).to.have.property('docs');
        expect(res.body).to.have.property('info');
        expect(res.body).to.have.property('version');
      })
      .expect(200);
  });

  it('GET /random-endpoint', async () => {
    await request(server)
      .get('/random-endpoint')
      .expect('content-type', /json/i)
      .expect((res) => {
        expect(res.body).to.have.property('code', '#notFound');
        expect(res.body).to.have.property('short');
        expect(res.body).to.have.property('long');
      })
      .expect(404);
  });
});
