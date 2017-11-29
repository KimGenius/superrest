# SuperREST

[SuperTest](https://github.com/visionmedia/supertest) helpers to test REST APIs.

[![npm version](https://badge.fury.io/js/superrest.svg)](https://badge.fury.io/js/superrest)
[![Dependency Status](https://gemnasium.com/badges/github.com/MediaComem/superrest.svg)](https://gemnasium.com/github.com/MediaComem/superrest)
[![Build Status](https://travis-ci.org/MediaComem/superrest.svg?branch=master)](https://travis-ci.org/MediaComem/superrest)
[![Coverage Status](https://coveralls.io/repos/github/MediaComem/superrest/badge.svg?branch=master)](https://coveralls.io/github/MediaComem/superrest?branch=master)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
  - [Basics](#basics)
  - [Extending SuperREST](#extending-superrest)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Read the [source code documentation](https://mediacomem.github.io/superrest/SuperRest.html).

Developed at the [Media Engineering Institute](http://mei.heig-vd.ch) ([HEIG-VD](https://heig-vd.ch)).



## Installation

```bash
$> npm install --save-dev superrest
```



## Usage

**SuperREST** is simply a wrapper around [SuperTest](https://github.com/visionmedia/supertest) that makes your work easier when testing standard REST APIs and CRUD methods.

```js
const SuperRest = require('superrest');
const app = require('./my-app');

// Create a reusable SuperREST instance with configuration that applies
// to your entire API. You only have to do this once.
const api = new SuperRest(app, {
  expectedContentType: /^application\/json/,
  pathPrefix: '/api'
});

describe('My API', function() {
  it('should create a user', async function() {
    // The following automatically makes a POST request to "/api/users"
    // (since "/api" is the "pathPrefix" option configured above), and
    // asserts that:
    //
    // * The status code of the response is 201 Created
    // * The Content-Type header of the response starts with application/json
    //   (as configured in the "expectedContentType" prefix above)
    const res = await api.create('/users', { name: 'John Doe' });
    expect(res.body).to.eql({ id: 1, name: 'John Doe' });
  });
});
```



## Documentation

Read the [source code documentation](https://mediacomem.github.io/superrest/SuperRest.html) to know how to initialize and use a SuperREST instance.

### Basics

All SuperREST does is pre-initialize a SuperTest chain with sane defaults for
REST APIs and return it.  Its `test` method does that; it also has `create`,
`update`, `retrieve`, `delete` and other CRUD methods which are simply aliases
for convenience.

The following code illustrates what SuperREST does:

```js
// SuperREST
const api = new SuperRest(app, {
  expectedContentType: /^application\/json/,
  pathPrefix: '/api'
});

// Using the `test` method
const testChain = api.test('POST', '/users', { foo: 'bar' });

// Using the `post` alias method
const postTestChain = api.post('/users', { foo: 'bar' });

// Equivalent SuperTest chain
const superTestChain = supertest(app)
  .post('/api/users')
  .send({ foo: 'bar' })
  .expect(res => {
    // Assertions with chai (as an example)
    expect(res.status).to.equal(201);
    expect(res.contentType).to.match(/^application\/json/);
  });
```

### Extending SuperREST

You may extend the class exported by the module to add functionality, namely:

* Override the `test` method to extend the returned SuperTest chain.
* Override the `expect` method to add standard expectations.

For example:

```js
const { expect } = require('chai');
const SuperRest = require('superrest');

class MySuperRest extends SuperRest {
  test(method, path, body, options) {
    // Add an Accept header to every request.
    return super.test(method, path, body, options).set('Accept', 'application/json');
  }

  expect(res, options) {
    super.expect(res, options);

    // Check a custom X-Request-Duration header sent by the server.
    expect(res.get('X-Request-Duration')).to.be.lte(100);
  }
}
```
