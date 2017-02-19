var http = require('http');
var request = require('request');

var student = process.argv[2];
var root = 'http://' + student + '.cs261.net/api/v1';

request(root + '/users/login?username=TestAdmin&password=PixarGoodGhibliBETTER',
    function(error, res, body)
    {
        var payload = JSON.parse(body).data;
        request(root + '/clients/get?_session=' + payload.session + '&_token=' + payload.token,
            function(error, res, body)
            {
               console.log(body);
            });
    });
