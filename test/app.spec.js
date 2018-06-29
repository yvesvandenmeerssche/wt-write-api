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
      .expect(200)
      .expect('content-type', /json/i)
      .expect((res) => {
        expect(res.body).to.have.property('docs');
        expect(res.body).to.have.property('info');
        expect(res.body).to.have.property('version');
      });
  });

  it('GET /random-endpoint', async () => {
    await request(server)
      .get('/random-endpoint')
      .expect(404)
      .expect('content-type', /json/i)
      .expect((res) => {
        expect(res.body).to.have.property('code', '#notFound');
        expect(res.body).to.have.property('short');
        expect(res.body).to.have.property('long');
      });
  });
});
