var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

var cp = require('child_process');

// Scan the 'test' directory for all JS files
var testDir = 'test';
var allTests = fs.readdirSync(testDir).filter(function(file){
    // Only keep the .js files
    return file.substr(-3) === '.js';
});

var student = process.argv[2];
var testsToRun = process.argv[3].split(',');
testsToRun.push('globals');

var allOptions = [ ];
if (process.argv[4]) {
    allOptions = process.argv[4].split(',');
}
allOptions.forEach(function(option) {
    process.env[option.toUpperCase()] = 1;
});

var url = 'http';
var port = 0;
for (let i = 0; i < testToRun.length; i++)
{
    if (testsToRun[i] == 'ssl')
        url += 's';
    else if (testsToRun[i].substr(0,4) == 'port')
    {
        var args = testsToRun[i].split('=');
        if (args.length > 1)
            port = args[1];
    }

url += '://';
url += student.replace(".", "-");
url += '.cs261.net';
if (port)
    url += port;
url += '/api/v1';
process.env.TEST_ROOT_URL = url;
process.env.TEST_ENDPOINTS = testsToRun;

process.env.TEST_ADMIN = 'TestAdmin';
process.env.TEST_ADMIN_PASSWORD = 'PixarGoodGhibliBETTER';

var mocha = new Mocha();
allTests.forEach(function(file) {
    var suite = file.substring(0, file.length - 3);
    if (testsToRun.indexOf(suite) >= 0) {
        mocha.addFile(path.join(testDir, file));
    }
});

mocha.run();
