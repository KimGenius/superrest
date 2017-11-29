/* istanbul ignore file */
const bodyParser = require('body-parser');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const express = require('express');
const _ = require('lodash');
const methods = require('methods');
const { spy, stub } = require('sinon');

const SuperRest = require('../index');

chai.use(chaiAsPromised);

const expect = chai.expect;

const EXPRESS_JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

describe('superrest', () => {

  let self;
  beforeEach(function() {
    self = this;
  });

  it('should be a function', function() {
    expect(SuperRest).to.be.a('function');
  });

  it('should test a route', async () => {
    const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
    const helper = new SuperRest(app);
    const res = await helper.test('GET', '/test');
    expect(res.status).to.equal(200);
    expect(res.body).to.eql({ resource: 'retrieved' });
  });

  it('should test a route with the GET method by default', async () => {
    const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
    const helper = new SuperRest(app);
    const res = await helper.test(undefined, '/test');
    expect(res.status).to.equal(200);
    expect(res.body).to.eql({ resource: 'retrieved' });
  });

  it('should test a route with the specified method, path and body', async () => {
    const app = buildApp(app => app.post('/test', (req, res) => res.send({ resource: 'posted', data: req.body })));
    const helper = new SuperRest(app);
    const res = await helper.test('POST', '/test', { foo: 'bar' });
    expect(res.status).to.equal(200);
    expect(res.body).to.eql({ resource: 'posted', data: { foo: 'bar' } });
  });

  it('should fail testing a route with an HTTP method unknown to supertest', async () => {
    const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
    const helper = new SuperRest(app);
    expect(() => helper.test('UNKNOWN', '/test', { foo: 'bar' })).to.throw('supertest has no "unknown" function');
  });

  describe('aliases', () => {

    function buildHelper(options) {
      const app = buildApp();
      const helper = new SuperRest(app, options);
      stub(helper, 'test').returns('test');
      return helper;
    }

    describe('create', () => {
      it('should test a create route', () => {
        const helper = buildHelper();
        expect(helper.create('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'POST', '/test', { foo: 'bar' }, { baz: 'qux', expectedStatus: 201 } ] ]);
      });

      it('should test a create route with another expected status code', () => {
        const helper = buildHelper();
        expect(helper.create('/test', { foo: 'bar' }, { baz: 'qux', expectedStatus: 200 })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'POST', '/test', { foo: 'bar' }, { baz: 'qux', expectedStatus: 200 } ] ]);
      });
    });

    describe('read', () => {
      it('should test a read route', () => {
        const helper = buildHelper();
        expect(helper.read('/test', { foo: 'bar' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'GET', '/test', undefined, { foo: 'bar' } ] ]);
      });
    });

    describe('retrieve', () => {
      it('should test a retrieve route', () => {
        const helper = buildHelper();
        expect(helper.retrieve('/test', { foo: 'bar' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'GET', '/test', undefined, { foo: 'bar' } ] ]);
      });
    });

    describe('update', () => {
      it('should test an update route', () => {
        const helper = buildHelper();
        expect(helper.update('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'PUT', '/test', { foo: 'bar' }, { baz: 'qux' } ] ]);
      });

      it('should test an update route with no options', () => {
        const helper = buildHelper();
        expect(helper.update('/test', { foo: 'bar' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'PUT', '/test', { foo: 'bar' }, {} ] ]);
      });

      it('should test an update route with the HTTP method given at construction', () => {
        const helper = buildHelper({ updateMethod: 'PATCH' });
        expect(helper.update('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'PATCH', '/test', { foo: 'bar' }, { baz: 'qux' } ] ]);
      });

      it('should test an update route with the HTTP method given to the method', () => {
        const helper = buildHelper();
        expect(helper.update('/test', { foo: 'bar' }, { baz: 'qux', method: 'PATCH' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'PATCH', '/test', { foo: 'bar' }, { baz: 'qux', method: 'PATCH' } ] ]);
      });

      it('should test an update route with the HTTP method given to the method rather than the one given at construction', () => {
        const helper = buildHelper({ updateMethod: 'PATCH' });
        expect(helper.update('/test', { foo: 'bar' }, { baz: 'qux', method: 'POST' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'POST', '/test', { foo: 'bar' }, { baz: 'qux', method: 'POST' } ] ]);
      });
    });

    describe('patch', () => {
      it('should test a patch route', () => {
        const helper = buildHelper();
        expect(helper.patch('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'PATCH', '/test', { foo: 'bar' }, { baz: 'qux' } ] ]);
      });
    });

    describe('delete', () => {
      it('should test a delete route', () => {
        const helper = buildHelper();
        expect(helper.delete('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'DELETE', '/test', { foo: 'bar' }, { baz: 'qux' } ] ]);
      });
    });

    describe('destroy', () => {
      it('should test a destroy route', () => {
        const helper = buildHelper();
        expect(helper.destroy('/test', { foo: 'bar' }, { baz: 'qux' })).to.equal('test');
        expect(helper.test.args).to.eql([ [ 'DELETE', '/test', { foo: 'bar' }, { baz: 'qux' } ] ]);
      });
    });
  });

  describe('"expectedContentType" option', () => {
    describe('as a regexp', () => {
      it('should test a route and match the content type regexp given at construction', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: /^application\/json/ });
        const res = await helper.test('GET', '/test');
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should test a route and match the content type regexp given to the method', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app);
        const res = await helper.test('GET', '/test', undefined, { expectedContentType: /^application\/json/ });
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should test a route and match the content type regexp given to the method over the one given at construction', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: /^application\/xml/ });
        const res = await helper.test('GET', '/test', undefined, { expectedContentType: /^application\/json/ });
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should fail testing a route if the content type regexp given at construction does not match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: /^application\/xml/ });
        await expect(helper.test('GET', '/test')).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to match /^application\\/xml/`);
      });

      it('should fail testing a create route if the content type regexp given to the method does not match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app);
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: /^application\/xml/ })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to match /^application\\/xml/`);
      });

      it('should fail testing a create route if the content type regexp given at construction matches but not the one given to the method', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: /^application\/json/ });
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: /^application\/xml/ })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to match /^application\\/xml/`);
      });
    });

    describe('as a string', () => {
      it('should test a route and match the content type string given at construction', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: EXPRESS_JSON_CONTENT_TYPE });
        const res = await helper.test('GET', '/test');
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should test a route and match the content type string given to the method', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app);
        const res = await helper.test('GET', '/test', undefined, { expectedContentType: EXPRESS_JSON_CONTENT_TYPE });
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should test a route and match the content type string given to the method over the one given at construction', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: 'application/xml' });
        const res = await helper.test('GET', '/test', undefined, { expectedContentType: EXPRESS_JSON_CONTENT_TYPE });
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({ resource: 'retrieved' });
      });

      it('should fail testing a route if the content type string given at construction does not match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: 'application/xml' });
        await expect(helper.test('GET', '/test')).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/xml"`);
      });

      it('should fail testing a route if the content type string given at construction is not an exact match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: 'application/json' });
        await expect(helper.test('GET', '/test')).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/json"`);
      });

      it('should fail testing a create route if the content type string given to the method does not match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app);
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: 'application/xml' })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/xml"`);
      });

      it('should fail testing a create route if the content type string given to the method is not an exact match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app);
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: 'application/json' })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/json"`);
      });

      it('should fail testing a create route if the content type string given at construction matches but not the one given to the method', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: EXPRESS_JSON_CONTENT_TYPE });
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: 'application/xml' })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/xml"`);
      });

      it('should fail testing a create route if the content type string given at construction matches but the one given to the method is not an exact match', async () => {
        const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
        const helper = new SuperRest(app, { expectedContentType: EXPRESS_JSON_CONTENT_TYPE });
        await expect(helper.test('GET', '/test', undefined, { expectedContentType: 'application/json' })).to.be.rejectedWith(`Expected HTTP Content-Type header "${EXPRESS_JSON_CONTENT_TYPE}" to equal "application/json"`);
      });
    });
  });

  describe('"expectedStatus" option', () => {
    it('should test a route and match the status code given to the method', async () => {
      const app = buildApp(app => app.post('/test', (req, res) => res.status(202).send({ resource: 'accepted', data: req.body })));
      const helper = new SuperRest(app);
      const res = await helper.test('POST', '/test', { foo: 'bar' }, { expectedStatus: 202 });
      expect(res.status).to.equal(202);
      expect(res.body).to.eql({ resource: 'accepted', data: { foo: 'bar' } });
    });

    it('should fail testing a route if the status code is not the default one', async () => {
      const app = buildApp(app => app.get('/test', (req, res) => res.status(201).send({ resource: 'created' })));
      const helper = new SuperRest(app);
      await expect(helper.test('GET', '/test')).to.be.rejectedWith('Expected HTTP status code 201 to equal 200');
    });

    it('should fail testing a route if the status code is not the expected one', async () => {
      const app = buildApp(app => app.get('/test', (req, res) => res.status(200).send({ resource: 'retrieved' })));
      const helper = new SuperRest(app);
      await expect(helper.test('GET', '/test', undefined, { expectedStatus: 302 })).to.be.rejectedWith('Expected HTTP status code 200 to equal 302');
    });
  });

  describe('"pathPrefix" option', () => {
    it('should test a route with the path prefix given at construction', async () => {
      const app = buildApp(app => app.get('/api/test', (req, res) => res.send({ resource: 'retrieved' })));
      const helper = new SuperRest(app, { pathPrefix: '/api' });
      const res = await helper.test('GET', '/test');
      expect(res.status).to.equal(200);
      expect(res.body).to.eql({ resource: 'retrieved' });
    });

    it('should test a route with the path prefix given to the method', async () => {
      const app = buildApp(app => app.get('/api/test', (req, res) => res.send({ resource: 'retrieved' })));
      const helper = new SuperRest(app);
      const res = await helper.test('GET', '/test', undefined, { pathPrefix: '/api' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql({ resource: 'retrieved' });
    });

    it('should test a route with the path prefix given to the method over the one given at construction', async () => {
      const app = buildApp(app => app.get('/api/test', (req, res) => res.send({ resource: 'retrieved' })));
      const helper = new SuperRest(app, { pathPrefix: '/foo' });
      const res = await helper.test('GET', '/test', undefined, { pathPrefix: '/api' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql({ resource: 'retrieved' });
    });

    it('should test a route without the path prefix given at construction if set to false when calling the method', async () => {
      const app = buildApp(app => app.get('/test', (req, res) => res.send({ resource: 'retrieved' })));
      const helper = new SuperRest(app, { pathPrefix: '/api' });
      const res = await helper.test('GET', '/test', undefined, { pathPrefix: false });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql({ resource: 'retrieved' });
    });
  });
});

function buildApp(...callbacks) {

  const app = express();
  app.use(bodyParser.json());

  callbacks.forEach(callback => callback(app));

  return app;
}
