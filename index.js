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

var studentTests = {
    'scott-smith': [ 'motd' ],
    'danny-wittenauer': [ 'motd' ],
    'mark-lauzon': [ 'motd' ],
    'j-heruty': [ 'motd' ],
    'andrew-taylor': [ 'motd' ],
    'joshua-shlemmer': [ 'motd' ],
    'j-fisher': [ 'motd' ],
    'nlouks': [ 'motd' ],
    'chad-george': [ 'motd' ],
    'ismail-obaid': [ 'motd' ],
    'j-peter': [ 'motd' ],
    'chase-hutchens': [ 'motd' ],
    'atownsend': [ 'motd' ],
    'j-shirley': [ 'motd' ],
    'greg-walls': [ 'motd' ],
    'eric-li': [ 'motd' ],
    'saerom-sim': [ 'motd' ],
    'kali-b': [ 'motd' ],
    'yoonyoung-k': [ 'motd' ],
    'c-eichner': [ 'motd' ],
    'euntaek-park': [ 'motd' ],
    'ryan-davidson': [ 'motd' ],
    'dylan-petterson': [ 'motd' ],
    'r-pannkuk': [ 'motd' ],
    'neil-frankwick': [ 'motd' ],
    'christopher-j': [ 'motd' ],
    'blake-richardson': [ 'motd' ],
    'michael-rosen': [ 'motd' ],
    'joel-shook': [ 'motd' ],
    'craig-steyn': [ 'motd' ],
    'river-riddle': [ 'motd' ],
    'c-john': [ 'motd' ],
    'd-jacobsen': [ 'motd' ],
    'daniel-oliveira': [ 'motd' ],
    'uong-j': [ 'motd' ],
    'tristan-schneider': [ 'motd' ],
    'hsihung-shih': [ 'motd' ]
};

var studentTestResults = {

};

// For each student, synchronously run all the appropriate tests
async.forEachOfSeries(studentTests, function(testsToRun, student, andThen) {
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

    cp.exec('node_modules/mocha/bin/mocha', function(err, stdout, stderr) {
        if (!err) {
            tested.stdout = stdout;
            tested.stderr = stderr;
        }
        andThen();
    });
}, function(err) {
    for (var student in studentTestResults) {
        console.log('**** ' + student);
        if (studentTestResults[student].stdout) {
            console.log(studentTestResults[student].stdout);
        }
        console.log('**********');
    }
});

