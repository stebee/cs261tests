var _root;
var _endpoints = [ ];

exports.getRoot = function() {
    if (!_root) {
        _root = process.env.TEST_ROOT_URL;
        if (!_root) {
            var port = process.env.PORT;
            if (!port)
                port = 7000;
            _root = 'http://127.0.0.1:' + port;
        }
    }

    return _root;
}

exports.shouldTest = function(endpoint) {
    if (!_endpoints || !_endpoints.length) {
        if (!process.env.TEST_ENDPOINTS)
            _endpoints = '*';
        else if (Array.isArray(process.env.TEST_ENDPOINTS))
            _endpoints = process.env.TEST_ENDPOINTS;
        else
            _endpoints = process.env.TEST_ENDPOINTS.split(',');
    }

    if (_endpoints === '*')
        return true;
    else {
        if (endpoint[0] == '/')
            endpoint = endpoint.substr(1);

        return (_endpoints.indexOf(endpoint) >= 0);
    }
}

exports.knownAdmin = process.env.TEST_ADMIN;
exports.knownAdminPassword = process.env.TEST_ADMIN_PASSWORD;