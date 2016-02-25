describe('/inventory', function() {
    var endpoint = this.title;
    var rootUrl = testContext.getRoot() + endpoint;

    var credentials = { };

    var hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    var testItem = { shortname: 'INVENTORY' + hex.substring(0, 4) };
    var otherTestItem = { shortname: 'INVENTORY' + hex.substring(4) };
    var testUser = { username: 'INVENTORY' + hex };

    function addAuth(obj) {
        var result = JSON.parse(JSON.stringify(obj));
        var underscore = '_';
        if (testContext.disableCredentialUnderscores)
            underscore = '';
        result[underscore + "session"] = credentials.session;
        result[underscore + "token"] = credentials.token;
        return result;
    }

    before(function(done) {
        async.series([
            function(callback) {
                utils.get(testContext.getRoot() + '/users', '/login', true, { username: testContext.knownAdmin, password: testContext.knownAdminPassword }, function(err, result) {
                    if (err) return callback(err);
                    credentials.session = result.data.session;
                    credentials.token = result.data.token;
                    if (result.data.id) {
                        credentials.id = result.data.id;
                        credentials.isAdmin = true;
                        callback();
                    }
                    else {
                        utils.get(testContext.getRoot() + '/users', '/find/' + testContext.knownAdmin, true, { "_session": credentials.session, "_token": credentials.token }, function(err, result) {
                            if (err) return callback(err);
                            credentials.id = result.data.id;

                            utils.get(testContext.getRoot() + '/users/', credentials.id + '/get', true, { "_session": credentials.session, "_token": credentials.token }, function(err, result) {
                                if (err) return callback(err);
                                credentials.isAdmin = result.data.isAdmin;
                                callback();
                            });
                        });
                    }
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/items', '/create', false, addAuth({ shortname: testItem.shortname }), function(err, result) {
                    if (err) return callback(err);
                    testItem.id = result.data.id;

                    utils.post(testContext.getRoot() + '/items', '/' + testItem.id + '/update', false, addAuth({ isStackable: true }), function(err, result) {
                        if (err) return callback(err);
                        testItem.isStackable = true;
                        callback();
                    });
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/items', '/create', false, addAuth({ shortname: otherTestItem.shortname }), function(err, result) {
                    if (err) return callback(err);
                    otherTestItem.id = result.data.id;
                    callback();
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/users', '/create', false, testUser, function(err, result) {
                    if (err) return callback(err);
                    testUser.id = result.data.id;
                    callback();
                });
            }
        ], function(err) {
            if (err) return done(err);
            done();
        });
    });

    describe('Verify test context', function() {
        it('credentials should be present', function(done) {
            credentials.should.have.property('session');
            credentials.should.have.property('token');
            credentials.should.have.property('id');
            credentials.should.have.property('isAdmin');
            credentials.isAdmin.should.equal(true);
            done();
        });

        it('test items should exist', function(done) {
            testItem.should.have.property('id');
            otherTestItem.should.have.property('id');
            done();
        });

        it('test user should exist', function(done) {
            testUser.should.have.property('id');
            done();
        });
    });

    describe('/create', function() {
        var method = this.title;
        var payload;

        before(function(done) {
            this.method = method;

            console.log(testUser);
            var body = {
                userid: testUser.id,
                items: [
                    { itemid: testItem.id, quantity: 5 },
                    { shortname: otherTestItem.shortname }
                ]
            };

            utils.post(rootUrl, method, false, addAuth(body), function(err, result) {
                if (err) return done(err);
                payload = result;
                console.log(payload);
                done();
            });
        });

        it('should return success', function(done) {
            console.log(testUser);
            payload.should.have.property('status');
            payload.status.should.equal('success');
            done();
        });
    });














});
