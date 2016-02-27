var request = require('supertest');
var logger = require('../superagent-logger');

exports.post = function(endpoint, method, body, callback) {
    var useQuerystring = process.env.PREFER_QUERYSTRING;
    var req = request(endpoint).post(method);

    if (body) {
        if (useQuerystring) {
            req.query(body);
        }
        else {
            req.set('Content-Type', 'application/json');
            req.send(body);
        }
    }

    if (process.env.VERBOSE_HTTP)
        req.use(logger({outgoing: true}));

    req.end(function(err, response) {
        if (err) return callback(err);
        if (response.text && (!response.body || !Object.keys(response.body).length)) {
            response.body = JSON.parse(response.text);
        }
        callback(null, response.body);
    });
}

exports.get = function(endpoint, method, body, callback) {
    var req = request(endpoint).get(method);

    if (body) {
        req.query(body);
    }
    // No request body on gets!

    if (process.env.VERBOSE_HTTP)
        req.use(logger({outgoing: true}));

    req.end(function(err, response) {
        if (err) return callback(err);
        if (response.text && (!response.body || !Object.keys(response.body).length)) {
            response.body = JSON.parse(response.text);
        }
        callback(null, response.body);
    });
}

