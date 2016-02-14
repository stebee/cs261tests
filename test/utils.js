var request = require('supertest');

exports.post = function(endpoint, method, useQuerystring, body, callback) {
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

    //console.log('POST ' + JSON.stringify(req) + JSON.stringify(body));

    req.end(function(err, response) {
        if (err) return callback(err);
        callback(null, response.body);
    });
}

exports.get = function(endpoint, method, useQuerystring, body, callback) {
    var req = request(endpoint).get(method);

    if (useQuerystring && body) {
        req.query(body);
    }
    // No request body on gets!

    //console.log('GET ' + JSON.stringify(req) + JSON.stringify(body));

    req.end(function(err, response) {
        if (err) return callback(err);
        callback(null, response.body);
    });
}

