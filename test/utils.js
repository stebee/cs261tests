var request = require('supertest');

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

    console.log('POST ' + JSON.stringify(req) + JSON.stringify(body));

    req.end(function(err, response) {
        console.log(response.text);
        if (response.text && (!response.body || !Object.keys(response.body).length)) {
            response.body = JSON.parse(response.text);
        }
        if (err) return callback(err);
        callback(null, response.body);
    });
}

exports.get = function(endpoint, method, body, callback) {
    var req = request(endpoint).get(method);

    if (body) {
        req.query(body);
    }
    // No request body on gets!

   // console.log('GET ' + JSON.stringify(req) + JSON.stringify(body));

    req.end(function(err, response) {
        if (response.text && (!response.body || !Object.keys(response.body).length)) {
            //console.log(response.text);
            response.body = JSON.parse(response.text);
        }
        if (err) return callback(err);
        callback(null, response.body);
    });
}

