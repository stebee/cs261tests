describe('/inventory', function() {
    var endpoint = this.title;
    var rootUrl = testContext.getRoot() + endpoint;

    var credentials = { };

    var hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    var testItem = { shortname: 'INVENTORY' + hex.substring(0, 4) };
    var otherTestItem = { shortname: 'INVENTORY' + hex.substring(4) };
    var testUser = { username: 'INVENTORY' + hex };

    var inventory = { };

    function addAuth(obj) {
        var result = JSON.parse(JSON.stringify(obj));
        var underscore = '_';
        if (process.env.DISABLE_UNDERSCORES)
            underscore = '';
        result[underscore + "session"] = credentials.session;
        result[underscore + "token"] = credentials.token;
        return result;
    }

    before(function(done) {
        async.series([
            function(callback) {
                utils.get(testContext.getRoot() + '/users', '/login', { username: testContext.knownAdmin, password: testContext.knownAdminPassword }, function(err, result) {
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

                            utils.get(testContext.getRoot() + '/users/', credentials.id + '/get', { "_session": credentials.session, "_token": credentials.token }, function(err, result) {
                                if (err) return callback(err);
                                credentials.isAdmin = result.data.isAdmin;
                                callback();
                            });
                        });
                    }
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/items', '/create', addAuth({ shortname: testItem.shortname }), function(err, result) {
                    if (err) return callback(err);
                    testItem.id = result.data.id;

                    utils.post(testContext.getRoot() + '/items', '/' + testItem.id + '/update', addAuth({ isStackable: true }), function(err, result) {
                        if (err) return callback(err);
                        testItem.isStackable = true;
                        callback();
                    });
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/items', '/create', addAuth({ shortname: otherTestItem.shortname }), function(err, result) {
                    if (err) return callback(err);
                    otherTestItem.id = result.data.id;
                    callback();
                });
            },

            function(callback) {
                utils.post(testContext.getRoot() + '/users', '/create', testUser, function(err, result) {
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

            var body = {
                items: [
                    { itemid: testItem.id, quantity: 5 },
                    { shortname: otherTestItem.shortname }
                ]
            };

            utils.post(testContext.getRoot() + '/users', '/' + testUser.id + '/inventory/create', addAuth(body), function(err, result) {
                if (err) return done(err);
                payload = result;

                // TODO HACK
                if (!payload.data)
                    payload.data = { inventory: payload.inventory };

                done();
            });
        });

        it('should return success', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            payload.should.have.property('data');
            payload.data.should.have.property('inventory');
            payload.data.inventory.should.be.Array();

            payload.data.inventory[0].should.be.Object();
            payload.data.inventory[0].should.have.property('id');
            payload.data.inventory[0].shortname.should.equal(testItem.shortname);
            payload.data.inventory[0].quantity.should.equal(5);
            inventory.testItem = payload.data.inventory[0];

            payload.data.inventory[1].should.be.Object();
            payload.data.inventory[1].should.have.property('id');
            payload.data.inventory[1].itemid.should.equal(otherTestItem.id);
            payload.data.inventory[1].quantity.should.equal(1);
            inventory.otherTestItem = payload.data.inventory[1];

            done();
        });
    });

    describe('/update with method suffix', function() {
        var method = this.title;
        var payloads = { };

        before(function(done) {
            var actualMethod = method;

            async.series([
                function(callback) {
                    utils.post(rootUrl, '/' + inventory.testItem.id + actualMethod, addAuth({ quantity: 10 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.testItem = result;
                        callback();
                    });
                },

                function(callback) {
                    utils.post(rootUrl, '/' + inventory.otherTestItem.id + actualMethod, addAuth({ quantity: 10 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.otherTestItemFail = result;
                        callback();
                    });
                },

                function(callback) {
                    utils.post(rootUrl, '/' + inventory.otherTestItem.id + actualMethod, addAuth({ quantity: 0 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.otherTestItemPass = result;
                        callback();
                    });
                }
            ], function(err) {
                done();
            });
        });

        it('should succeed when changing quantity of stackable item', function(done) {
            payloads.testItem.should.have.property('status');
            payloads.testItem.status.should.equal('success');
            payloads.testItem.should.have.property('data');
            payloads.testItem.data.should.have.property('quantity');
            payloads.testItem.data.quantity.should.equal(10);

            done();
        });

        it('should fail when changing quantity of non-stackable item to greater than one', function(done) {
            payloads.otherTestItemFail.should.have.property('status');
            payloads.otherTestItemFail.status.should.equal('fail');
            payloads.otherTestItemFail.should.have.property('reason');
            payloads.otherTestItemFail.reason.should.have.property('quantity');
            payloads.otherTestItemFail.reason.quantity.toLowerCase().should.equal('invalid');

            done();
        });

        it('should succeed when changing quantity of non-stackable item to zero', function(done) {
            payloads.otherTestItemPass.should.have.property('status');
            payloads.otherTestItemPass.status.should.equal('success');
            payloads.otherTestItemPass.should.have.property('data');
            payloads.otherTestItemPass.data.should.have.property('quantity');
            payloads.otherTestItemPass.data.quantity.should.equal(0);

            done();
        });
    });

    describe('/update without method suffix', function() {
        var method = this.title;
        var payloads = { };

        before(function(done) {
            var actualMethod = '';//method;

            async.series([
                function(callback) {
                    utils.post(rootUrl, '/' + inventory.testItem.id + actualMethod, addAuth({ quantity: 10 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.testItem = result;
                        callback();
                    });
                },

                function(callback) {
                    utils.post(rootUrl, '/' + inventory.otherTestItem.id + actualMethod, addAuth({ quantity: 10 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.otherTestItemFail = result;
                        callback();
                    });
                },

                function(callback) {
                    utils.post(rootUrl, '/' + inventory.otherTestItem.id + actualMethod, addAuth({ quantity: 0 }), function(err, result) {
                        if (err) return callback(err);
                        payloads.otherTestItemPass = result;
                        callback();
                    });
                }
            ], function(err) {
                done();
            });
        });

        it('should succeed when changing quantity of stackable item', function(done) {
            payloads.testItem.should.have.property('status');
            payloads.testItem.status.should.equal('success');
            payloads.testItem.should.have.property('data');
            payloads.testItem.data.should.have.property('quantity');
            payloads.testItem.data.quantity.should.equal(10);

            done();
        });

        it('should fail when changing quantity of non-stackable item to greater than one', function(done) {
            payloads.otherTestItemFail.should.have.property('status');
            payloads.otherTestItemFail.status.should.equal('fail');
            payloads.otherTestItemFail.should.have.property('reason');
            payloads.otherTestItemFail.reason.should.have.property('quantity');
            payloads.otherTestItemFail.reason.quantity.toLowerCase().should.equal('invalid');

            done();
        });

        it('should succeed when changing quantity of non-stackable item to zero', function(done) {
            payloads.otherTestItemPass.should.have.property('status');
            payloads.otherTestItemPass.status.should.equal('success');
            payloads.otherTestItemPass.should.have.property('data');
            payloads.otherTestItemPass.data.should.have.property('quantity');
            payloads.otherTestItemPass.data.quantity.should.equal(0);

            done();
        });
    });













});
