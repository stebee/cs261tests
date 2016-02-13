var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

// Scan the 'test' directory for all JS files
var testDir = 'test';
var allTests = fs.readdirSync(testDir).filter(function(file){
    // Only keep the .js files
    return file.substr(-3) === '.js';
});

var studentTests = {
    'stephen.beeman': [ 'motd', 'inventory' ]
};

var studentTestResults = {

};

// For each student, synchronously run all the appropriate tests
async.forEachOfSeries(studentTests, function(testsToRun, student, andThen) {
    var mocha = new Mocha();
    allTests.forEach(function(file){
        mocha.addFile(
            path.join(testDir, file)
        );
    });

    var url = 'http';
    if (testsToRun.indexOf('ssl') >= 0)
        url += 's';
    url += '://';
    url += student.replace(".", "-");
    url += '.cs261.net/api/v1';
    process.env.TEST_ROOT_URL = url;
    process.env.TEST_ENDPOINTS = testsToRun;

    var tested = { };
    studentTestResults[student] = tested;

    // Run the tests
    var tests = mocha.run();

    tests.on('start', function() {
        console.log('Starting tests for ' + student + '...');
    });

    tests.on('end', function() {
        andThen();
    });

    tests.on('suite', function(suite) {
        if (!suite.parent) return;
        if (!suite.parent.title) {
            // If suite.parent.title is blank, then we're an endpoint
            var endpoint = suite.title.substr(1);
            tested[endpoint] = { passed: 0, failed: 0, failures: [ ] };
        }
    });

    tests.on('pass', function(test) {
        var endpoint = test.parent.parent.title.substr(1);
        tested[endpoint].passed += 1;
    });

    tests.on('fail', function(test, err) {
        var endpoint = test.parent.parent.title.substr(1);
        var method = test.parent.title.substr(1);
        tested[endpoint].failed += 1;
        tested[endpoint].failures.push(test.parent.title + ' ' + test.title);
    });
}, function(err) {
    for (var student in studentTestResults) {
        console.log(student + ':');
        for (var endpoint in studentTestResults[student]) {
            var result = studentTestResults[student][endpoint];
            if (!result.passed && !result.failed) {
                console.log('---- ' + endpoint + ' skipped!');
            }
            else {
                var pct = Math.floor(100 * result.passed / (result.passed + result.failed));
                var pctString = '' + pct;
                while (pctString.length < 3)
                    pctString = ' ' + pctString;

                console.log('    ' + pctString + '% ' + endpoint);
            }

            if (result.failed > 0) {
                for (var key in result.failures) {
                    console.log('         * ' + result.failures[key]);
                }
            }
        }
    }
});

