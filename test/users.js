var assert = require('assert');
var should = require('should');
var request = require('supertest');
var context = require('./context');
var crypto = require('crypto');
var utils = require('./utils');

describe('/users', function() {
    var endpoint = this.title;
    var expectedAccount = { };
    var findAccount = { };
    var useQuerystring = false;

    before(function(done) {
        this.endpoint = endpoint;
        this.url = context.getRoot() + this.endpoint;
        if (!context.shouldTest(this.endpoint))
            this.skip();

        // Do any endpoint-level setup here
        crypto.randomBytes(5, function(err, buf) {
            var hex = buf.toString('hex').toUpperCase();
            expectedAccount.username = 'TestUser' + hex.substr(0, 5);
            expectedAccount.password = hex.substr(5);
            expectedAccount.avatar = 'http://open-site.org/img/logos/443410.jpg';

            findAccount.username = 'TestUser' + hex.substr(5);
            findAccount.password = hex.substr(0, 5);
            findAccount.avatar = 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg';
        });

        done();
    });


    describe('/create', function() {
        var method = this.title;
        var payload;
        before(function(done) {
            this.method = method;

            var body = {
                username: expectedAccount.username,
                password: expectedAccount.password,
                avatar: expectedAccount.avatar
            };

            var url = this.url;
            console.log(url);
            console.log(method);

            utils.post(url, method, useQuerystring, body, function(err, result) {
                if (err) return done(err);
                payload = result;
                utils.post(url, method, useQuerystring, findAccount, function(err, result) {
                    if (err) return done(err);
                    findAccount.id = result.data.id;
                    done();
                });
            });
        });

        it('should return success', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            done();
        });

        it('should return an id', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('id');
            payload.data.id.toString().length.should.be.greaterThan(0);
            expectedAccount.id = payload.data.id;
            done();
        });

        it('should return the username', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('username');
            payload.data.username.should.equal(expectedAccount.username);
            done();
        });

        it('should fail if username not unique', function(done) {
            var body = {
                username: expectedAccount.username,
                password: 'INVALID',
                avatar: 'trollface.jpg'
            };

            utils.post(this.url, this.method, useQuerystring, body, function(err, result) {
                if (err) return done(err);
                result.should.have.property('status');
                result.status.should.equal('fail');
                result.should.have.property('reason');
                result.reason.should.have.property('username');
                result.reason.username.should.equal('Already taken');
                done();
            });
        });
    });

    describe('/login', function() {
        var method = this.title;
        var payload;

        before(function(done) {
            this.method = method;

            utils.get(this.url, this.method, true, { username: expectedAccount.username, password: expectedAccount.password }, function(err, result) {
                if (err) return done(err);
                payload = result;
                done();
            });
        });

        it('should return success', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            done();
        });

        it('should return a session', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('session');
            expectedAccount.session = payload.data.session.toString();
            expectedAccount.session.length.should.be.greaterThan(0);
            done();
        });

        it('should return a token', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('token');
            expectedAccount.token = payload.data.token.toString();
            expectedAccount.token.length.should.be.greaterThan(0);
            done();
        });

        it('should fail if password wrong', function(done) {
            utils.get(this.url, this.method, true, { username: expectedAccount.username, password: expectedAccount.password + 'NOTHISISNOTTHEPASSWORD' }, function(err, result) {
                if (err) return done(err);
                result.should.have.property('status');
                result.status.should.equal('fail');
                result.should.have.property('reason');
                result.reason.should.equal('Username/password mismatch');
                done();
            });
        });

        it('should fail if username wrong', function(done) {
            utils.get(this.url, this.method, true, { username: expectedAccount.username + 'THISUSERDOESNOTEXIST', password: expectedAccount.password }, function(err, result) {
                if (err) return done(err);
                result.should.have.property('status');
                result.status.should.equal('fail');
                result.should.have.property('reason');
                result.reason.should.equal('Username/password mismatch');
                done();
            });
        });
    });

    describe('/:id/get', function() {
        var method = '/get';
        var payload;

        before(function(done) {
            this.method = method;

            utils.get(this.url, '/' + findAccount.id + this.method, false, { "_session": expectedAccount.session, "_token": expectedAccount.token }, function(err, result) {
                if (err) return done(err);
                payload = result;
                done();
            });
        });

        it('should return success', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            done();
        });

        it('should return the username', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('username');
            payload.data.username.should.equal(findAccount.username);
            done();
        });

        it('should return the avatar', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('avatar');
            payload.data.avatar.should.equal(findAccount.avatar);
            done();
        });
    });
});
