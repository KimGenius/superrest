const _ = require('lodash');
const supertest = require('supertest');

/**
 * [SuperTest](https://github.com/visionmedia/supertest#readme) helpers to test REST APIs.
 *
 * @class
 * @see https://github.com/visionmedia/supertest#readme
 */
class SuperRest {

  /**
   * Returns a SuperREST instance to test the specified application.
   *
   * @constructs
   *
   * @param {Application} app - The application to test.
   *
   * @param {object} [options] - SuperREST configuration that applies to your entire API.
   *
   * @param {string|RegExp} [options.expectedContentType] - The default Content-Type header that the server is expected to use in responses.
   *   An exact match is required if it's a string.
   *
   * @param {string} [options.pathPrefix] - A prefix common to all your API routes.
   *   If given at construction, you won't have to repeat it for each test.
   *
   * @param {string} [options.updateMethod="PUT"] - The HTTP method used when calling the `update` method.
   *   You might want to use `PATCH` if your API uses only that, or use the `patch` method instead.
   */
  constructor(app, options) {
    options = options || {};

    this.app = app;
    this.expectedContentType = options.expectedContentType;
    this.pathPrefix = options.pathPrefix || '';
    this.updateMethod = options.updateMethod || 'PUT';
  }

  /**
   * Starts and returns a SuperTest chain.
   *
   * @method
   *
   * @param {string} [method="GET"] - The HTTP method.
   *
   * @param {string} path - The path of the API resource to test.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} [body] - The request body to send to the server, if any.
   *
   * @param {object} [options] - Test options.
   *
   * @param {string|RegExp} [options.expectedContentType] - The Content-Type header expected
   *   to be found in the response. An exact match is required if it's a string. Overrides the
   *   `expectedContentType` option given to the constructor.
   *
   * @param {number} [options.expectedStatusCode=200] - The expected HTTP status code of the
   *   response.
   *
   * @param {boolean|string} [options.pathPrefix] - A path prefix to use for this specific test.
   *   Overrides the `pathPrefix` option given to the constructor. If false and a `pathPrefix`
   *   option was given to the constructor, it is not used (the `path` argument is used as is).
   */
  test(method, path, body, options) {
    options = options || {};

    let test = supertest(this.app);

    const testMethod = (method || 'GET').toLowerCase();
    if (typeof(test[testMethod]) != 'function') {
      throw new Error(`supertest has no "${testMethod}" function`);
    }

    let testPath = path;
    if (options.pathPrefix) {
      testPath = `${options.pathPrefix}${testPath}`;
    } else if (this.pathPrefix && (options.pathPrefix === undefined || options.pathPrefix === true)) {
      testPath = `${this.pathPrefix}${testPath}`;
    }

    test = test[testMethod](testPath);

    if (body) {
      test = test.send(body);
    }

    test = test.expect(res => {
      this.expect(res, options);
    });

    return test;
  }

  /**
   * Make default RESTful assertions on a SuperTest response.
   *
   * This method is used by {@link SuperRest#test} (and all CRUD aliases).
   * You may override it to perform additional assertions.
   *
   * @method
   *
   * @param {Response} res - A SuperTest response.
   *
   * @param {object} [options] - Assertion options.
   *
   * @param {string|RegExp} [options.expectedContentType] - The Content-Type header expected
   *   to be found in the response. An exact match is required if it's a string. Overrides the
   *   `expectedContentType` option given to the constructor.
   *
   * @param {number} [options.expectedStatusCode=200] - The expected HTTP status code of the
   *   response.
   */
  expect(res, options) {

    const expectedStatus = options.expectedStatus !== undefined ? options.expectedStatus : 200;
    if (res.status !== expectedStatus) {
      throw new Error(`Expected HTTP status code ${res.status} to equal ${expectedStatus}`);
    }

    const expectedContentType = options.expectedContentType !== undefined ? options.expectedContentType : this.expectedContentType;
    if (_.isString(expectedContentType) && res.get('Content-Type') !== expectedContentType) {
      throw new Error(`Expected HTTP Content-Type header "${res.get('Content-Type')}" to equal "${expectedContentType}"`);
    } else if (_.isRegExp(expectedContentType) && !res.get('Content-Type')) {
      throw new Error(`Expected missing HTTP Content-Type header to match ${expectedContentType}`);
    } else if (_.isRegExp(expectedContentType) && !res.get('Content-Type').match(expectedContentType)) {
      throw new Error(`Expected HTTP Content-Type header "${res.get('Content-Type')}" to match ${expectedContentType}`);
    }
  }

  /**
   * Makes a POST request to create a resource with the specified body. The response
   * is expected to have the status code HTTP 201 Created by default.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} body - The request body to send to the server.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   *
   * @param {number} [options.expectedStatusCode=201] - The expected HTTP status code of the
   *   response.
   */
  create(path, body, options) {
    return this.test('POST', path, body, _.defaults({}, options, {
      expectedStatus: 201
    }));
  }

  /**
   * Makes a GET request to read a resource.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  read(path, options) {
    return this.test('GET', path, undefined, options);
  }

  /**
   * Makes a GET request to retrieve a resource.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  retrieve(...args) {
    return this.read(...args);
  }

  /**
   * Makes a PUT request to update a resource with the specified body.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} body - The request body to send to the server.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  update(path, body, options) {
    options = options || {};
    return this.test(options.method || this.updateMethod, path, body, options);
  }

  /**
   * Makes a PATCH request to partially update a resource with the specified body.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} body - The request body to send to the server.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  patch(path, body, options) {
    return this.test('PATCH', path, body, options);
  }

  /**
   * Makes a DELETE request to delete a resource.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} [body] - An optional request body to send to the server.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  delete(path, body, options) {
    return this.test('DELETE', path, body, options);
  }

  /**
   * Makes a DELETE request to destroy a resource.
   *
   * @method
   *
   * @param {string} path - The path of the API resource.
   *   If a non-false `pathPrefix` option is given to the constructor or to this method,
   *   it will be prepended to the path to form the full test path.
   *
   * @param {*} [body] - An optional request body to send to the server.
   *
   * @param {object} [options] - Assertion options (see {@link SuperRest#test} for all options).
   */
  destroy(...args) {
    return this.delete(...args);
  }
}

module.exports = SuperRest;
