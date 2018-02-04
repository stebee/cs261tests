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
if (testsToRun.indexOf('ssl') >= 0)
    url += 's';
url += '://';
//url += student.replace(".", "-");
//url += '.cs261.net';
url += student;
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
