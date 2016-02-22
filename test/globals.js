/*
    Mocha has a root test suite with no name. Creating hooks like before()
    outside of any describe() context puts them in this root suite. They
    will then get called before any other suite, allowing us to do global
    setup.
 */
global.assert = require('assert');
global.should = require('should');
global.request = require('supertest');
global.crypto = require('crypto');
global.utils = require('./utils');
global.testContext = require('./context');
global.async = require('async');

before(function(done) {
    // The following line disables verification of SSL certificates, allowing use of self-signed certs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    done();
});
