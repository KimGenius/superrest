const _ = require('lodash')
const supertest = require('supertest')

class SuperRest {
  /**
   * @constructs
   * @param {Application} app - The application to test.
   * @param {object} [options] - SuperREST configuration that applies to your entire API.
   * @param {string|RegExp} [options.expectedContentType] - The default Content-Type header that the server is expected to use in responses.
   * @param {string} [options.pathPrefix] - A prefix common to all your API routes.
   * @param {string} [options.updateMethod="PUT"] - The HTTP method used when calling the `update` method.
   */
  constructor(app, options) {
    options = options || {}
    this.app = app
    this.expectedContentType = options.expectedContentType
    this.pathPrefix = options.pathPrefix || ''
    this.updateMethod = options.updateMethod || 'PUT'
  }

  /**
   * @method
   * @param {string} [method="GET"] - The HTTP method.
   * @param {string} path - The path of the API resource to test.
   * @param {*} [body] - The request body to send to the server, if any.
   * @param {object} [options] - Test options.
   * @param {string|RegExp} [options.expectedContentType] - The Content-Type header expected
   *   to be found in the response. An exact match is required if it's a string.
   * @param {number} [options.expectedStatusCode=200] - The expected HTTP status code of the response.
   * @param {boolean|string} [options.pathPrefix] - A path prefix to use for this specific test.
   *   Overrides the `pathPrefix` option given to the constructor. If false and a `pathPrefix`
   *   option was given to the constructor, it is not used (the `path` argument is used as is).
   */
  test(method, path, body, options) {
    options = options || {}
    let test = supertest(this.app)
    const testMethod = (method || 'GET').toLowerCase()
    if (typeof(test[testMethod]) != 'function') {
      throw new Error(`supertest has no "${testMethod}" function`)
    }

    let testPath = path
    if (options.pathPrefix) {
      testPath = `${options.pathPrefix}${testPath}`
    } else if (this.pathPrefix && (options.pathPrefix === undefined || options.pathPrefix === true)) {
      testPath = `${this.pathPrefix}${testPath}`
    }

    test = test[testMethod](testPath)
    if (body) {
      test = test.send(body)
    }

    test = test.expect(res => {
      this.expect(res, options)
    })
    return test
  }

  /**
   * @method
   * @param {Response} res - A SuperTest response.
   * @param {object} [options] - Assertion options.
   * @param {string|RegExp} [options.expectedContentType] - The Content-Type header expected
   *   to be found in the response. An exact match is required if it's a string. Overrides the
   *   `expectedContentType` option given to the constructor.
   * @param {number} [options.expectedStatusCode=200] - The expected HTTP status code of the response.
   */
  expect(res, options) {

    const expectedStatusCode = options.expectedStatusCode !== undefined ? options.expectedStatusCode : 200
    if (res.status !== expectedStatusCode) {
      throw new Error(`Expected HTTP status code ${res.status} to equal ${expectedStatusCode}`)
    }

    const expectedContentType = options.expectedContentType !== undefined ? options.expectedContentType : this.expectedContentType
    if (_.isString(expectedContentType) && res.get('Content-Type') !== expectedContentType) {
      throw new Error(`Expected HTTP Content-Type header "${res.get('Content-Type')}" to equal "${expectedContentType}"`)
    } else if (_.isRegExp(expectedContentType) && !res.get('Content-Type')) {
      throw new Error(`Expected missing HTTP Content-Type header to match ${expectedContentType}`)
    } else if (_.isRegExp(expectedContentType) && !res.get('Content-Type').match(expectedContentType)) {
      throw new Error(`Expected HTTP Content-Type header "${res.get('Content-Type')}" to match ${expectedContentType}`)
    }
  }

  post(path, body, options) {
    return this.test('POST', path, body, _.defaults({}, options, {
      expectedStatusCode: 200
    }))
  }

  get(path, options) {
    return this.test('GET', path, undefined, options)
  }

  delete(path, body, options) {
    return this.test('DELETE', path, body, options)
  }

  put(path, body, options) {
    return this.test('PUT', path, body, _.defaults({}, options, {
      expectedStatusCode: 200
    }))
  }
}

module.exports = SuperRest