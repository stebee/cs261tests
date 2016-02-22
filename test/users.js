describe('/users', function() {
    var endpoint = this.title;
    var expectedAccount = { };
    var findAccount = { };
    var useQuerystring = false;
    var rootUrl = testContext.getRoot() + endpoint;

    // Do any endpoint-level setup here
    var hex = crypto.randomBytes(5).toString('hex').toUpperCase();
    expectedAccount.username = 'TestUser' + hex.substr(0, 5);
    expectedAccount.password = hex.substr(5);
    expectedAccount.avatar = 'http://open-site.org/img/logos/443410.jpg';

    findAccount.username = 'TestUser' + hex.substr(5);
    findAccount.password = hex.substr(0, 5);
    findAccount.avatar = 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg';

    before(function(done) {
        if (!testContext.shouldTest(endpoint))
            this.skip();
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

            utils.post(rootUrl, method, useQuerystring, body, function(err, result) {
                if (err) return done(err);
                payload = result;
                utils.post(rootUrl, method, useQuerystring, findAccount, function(err, result) {
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

            utils.post(rootUrl, this.method, useQuerystring, body, function(err, result) {
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

            utils.get(rootUrl, this.method, true, { username: expectedAccount.username, password: expectedAccount.password }, function(err, result) {
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
            utils.get(rootUrl, this.method, true, { username: expectedAccount.username, password: expectedAccount.password + 'NOTHISISNOTTHEPASSWORD' }, function(err, result) {
                if (err) return done(err);
                result.should.have.property('status');
                result.status.should.equal('fail');
                result.should.have.property('reason');
                result.reason.should.equal('Username/password mismatch');
                done();
            });
        });

        it('should fail if username wrong', function(done) {
            utils.get(rootUrl, this.method, true, { username: expectedAccount.username + 'THISUSERDOESNOTEXIST', password: expectedAccount.password }, function(err, result) {
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

            utils.get(rootUrl, '/' + findAccount.id + this.method, false, { "_session": expectedAccount.session, "_token": expectedAccount.token }, function(err, result) {
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

    describe('/find/:username', function() {
        var method = '/find';
        var payload;

        before(function(done) {
            this.method = method;

            utils.get(rootUrl, this.method + '/' + findAccount.username, false, { "_session": expectedAccount.session, "_token": expectedAccount.token }, function(err, result) {
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

        it('should return the id', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('id');
            payload.data.id.should.equal(findAccount.id);
            done();
        });
    });

    describe('/:id/update', function() {
        var method = '/update';
        var payloads = { };

        before(function(done) {
            if (!testContext.shouldTest(endpoint))
                this.skip();

            async.series([
                function(callback) {
                    utils.get(rootUrl, '/login', true, { username: findAccount.username, password: findAccount.password }, function(err, result) {
                        if (err) return done(err);
                        payloads.credentials = result.data;
                        callback();
                    });
                },

                function(callback) {
                    var body = {
                        "_session": payloads.credentials.session,
                        "_token": payloads.credentials.token,
                        isAdmin: true
                    };

                    utils.post(rootUrl, '/' + findAccount.id + method, false, body, function(err, result) {
                        if (err) return callback(err);
                        payloads.isAdmin = result;
                        callback();
                    });
                },

                function(callback) {
                    var body = {
                        "_session": payloads.credentials.session,
                        "_token": payloads.credentials.token,
                        oldPassword: 'NOTTHEPASSWORD',
                        newPassword: 'ALSONOTTHEPASSSWORD'
                    };

                    utils.post(rootUrl, '/' + findAccount.id + method, false, body, function(err, result) {
                        if (err) return callback(err);
                        payloads.badPassword = result;
                        callback();
                    });
                },

                function(callback) {
                    var body = {
                        "_session": payloads.credentials.session,
                        "_token": payloads.credentials.token,
                        avatar: 'http://lazytechguys.com/wp-content/uploads/2012/04/Wing-Commander-2-Screenshots-10.gif'
                    };

                    utils.post(rootUrl, '/' + expectedAccount.id + method, false, body, function(err, result) {
                        if (err) return callback(err);
                        payloads.avatar = result;
                        payloads.avatar.expectedValue = body.avatar;
                        callback();
                    });
                },

                function(callback) {
                    var body = {
                        "_session": payloads.credentials.session,
                        "_token": payloads.credentials.token,
                        oldPassword: findAccount.password,
                        newPassword: 'NEWPASSWORD'
                    };

                    utils.post(rootUrl, '/' + findAccount.id + method, false, body, function(err, result) {
                        if (err) return callback(err);
                        payloads.changedPassword = result;
                        utils.get(rootUrl, '/login', true, { username: findAccount.username, password: body.newPassword }, function(err, loginResult) {
                            if (err) return callback(err);
                            payloads.changedPasswordLogin = loginResult;
                            callback();
                        });
                    });
                }
            ], function() {
                done();
            });
        });

        it('should fail to change isAdmin', function(done) {
            payloads.isAdmin.should.have.property('status');
            payloads.isAdmin.status.should.equal('fail');
            payloads.isAdmin.should.have.property('reason');
            payloads.isAdmin.reason.should.have.property('isAdmin');
            payloads.isAdmin.reason.isAdmin.should.equal('Forbidden');
            done();
        });

        it('should fail to change password if oldPassword not correct', function(done) {
            payloads.badPassword.should.have.property('status');
            payloads.badPassword.status.should.equal('fail');
            payloads.badPassword.should.have.property('reason');
            payloads.badPassword.reason.should.have.property('id');
            payloads.badPassword.reason.id.should.equal('Forbidden');
            done();
        });

        it('should change avatar', function(done) {
            payloads.avatar.should.have.property('status');
            payloads.avatar.status.should.equal('success');
            payloads.avatar.should.have.property('data');
            payloads.avatar.data.should.have.property('avatar');
            payloads.avatar.data.avatar.should.equal(payloads.avatar.expectedValue);
            done();
        });

        it('should change password', function(done) {
            payloads.changedPassword.should.have.property('status');
            payloads.changedPassword.status.should.equal('success');
            payloads.changedPassword.should.have.property('data');
            payloads.changedPassword.data.should.have.property('passwordChanged');
            payloads.changedPassword.data.passwordChanged.should.equal(true);
            payloads.changedPasswordLogin.should.have.property('status');
            payloads.changedPasswordLogin.status.should.equal('success');
            done();
        });
    });
});
