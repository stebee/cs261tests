describe('/items', function() {
    var endpoint = this.title;
    var rootUrl = testContext.getRoot() + endpoint;

    var credentials = { };

    var hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    var testItem = { shortname: 'ITEM' + hex.substring(0, 4) };
    var otherTestItem = { shortname: 'ITEM' + hex.substring(4) };

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
        utils.get(testContext.getRoot() + '/users', '/login', true, { username: testContext.knownAdmin, password: testContext.knownAdminPassword }, function(err, result) {
            if (err) return done(err);
            credentials.session = result.data.session;
            credentials.token = result.data.token;
            if (result.data.id) {
                credentials.id = result.data.id;
                credentials.isAdmin = true;
                done();
            }
            else {
                utils.get(testContext.getRoot() + '/users', '/find/' + testContext.knownAdmin, true, { "_session": credentials.session, "_token": credentials.token }, function(err, result) {
                    if (err) return done(err);
                    credentials.id = result.data.id;

                    utils.get(testContext.getRoot() + '/users/', credentials.id + '/get', true, { "_session": credentials.session, "_token": credentials.token }, function(err, result) {
                        if (err) return done(err);
                        credentials.isAdmin = result.data.isAdmin;
                        done();
                    });
                });
            }
        });
    });

    describe('Verify admin account', function() {
        it('credentials should be present', function(done) {
            credentials.should.have.property('session');
            credentials.should.have.property('token');
            credentials.should.have.property('id');
            credentials.should.have.property('isAdmin');
            credentials.isAdmin.should.equal(true);

            console.log(credentials);
            done();
        });
    });

    describe('/create', function() {
        var method = this.title;
        var payload;

        before(function(done) {
            this.method = method;

            utils.post(rootUrl, method, false, addAuth({ shortname: testItem.shortname }), function(err, result) {
                if (err) return done(err);
                payload = result;

                utils.post(rootUrl, method, false, addAuth({ shortname: otherTestItem.shortname }), function(err, result) {
                    if (result && result.data) {
                        otherTestItem.id = result.data.id;

                        otherTestItem.name = otherTestItem.shortname;
                        otherTestItem.description = '';
                        otherTestItem.isStackable = false;
                        otherTestItem.attributes = { };
                    }
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
            testItem.id = payload.data.id;
            done();
        });

        it('should return the shortname', function(done) {
            payload.should.have.property('data');
            payload.data.should.have.property('shortname');
            payload.data.shortname.should.equal(testItem.shortname);
            done();
        });

        it('should fail if shortname not unique', function(done) {

            utils.post(rootUrl, this.method, false, addAuth({ shortname: testItem.shortname }), function(err, result) {
                if (err) return done(err);
                result.should.have.property('status');
                result.status.should.equal('fail');
                result.should.have.property('reason');
                result.reason.should.have.property('shortname');
                result.reason.shortname.should.equal('Already taken');
                done();
            });
        });
    });

    describe('/:id/update', function() {
        var method = '/update';
        var payloads = {  };

        function testExpectation(key) {
            it('should change ' + key, function(done) {
                payloads[key].should.have.property('status');
                payloads[key].status.should.equal('success');
                payloads[key].should.have.property('data');
                payloads[key].data.should.have.property(key);

                if (typeof testItem[key] === 'object') {
                    for (var property in testItem[key]) {
                        payloads[key].data[key].should.have.property(property);
                        payloads[key].data[key][property].toString().should.equal(testItem.attributes[property].toString());
                    }
                }
                else
                    payloads[key].data[key].toString().should.equal(testItem[key].toString());

                done();
            });
        }

        before(function(done) {
            async.series([
                function(callback) {
                    testItem.name = 'A test name';

                    utils.post(rootUrl, '/' + testItem.id + method, false, addAuth({ name: testItem.name }), function(err, result) {
                        if (err) return callback(err);
                        payloads.name = result;
                        callback();
                    });
                },

                function(callback) {
                    testItem.description = 'A test description.\nThese can even have carriage returns in them!';

                    utils.post(rootUrl, '/' + testItem.id + method, false, addAuth({ description: testItem.description }), function(err, result) {
                        if (err) return callback(err);
                        payloads.description = result;
                        callback();
                    });
                },

                function(callback) {
                    testItem.isStackable = true;

                    utils.post(rootUrl, '/' + testItem.id + method, false, addAuth({ isStackable: testItem.isStackable }), function(err, result) {
                        if (err) return callback(err);
                        payloads.isStackable = result;
                        callback();
                    });
                },

                function(callback) {
                    testItem.attributes = { movie: 'Deadpool', maximumEffort: true, payday: 152193853 };

                    utils.post(rootUrl, '/' + testItem.id + method, false, addAuth({ attributes: testItem.attributes }), function(err, result) {
                        if (err) return callback(err);
                        payloads.attributes = result;
                        callback();
                    });
                }
            ], function() {
                done();
            });
        });

        testExpectation('name');
        testExpectation('description');
        testExpectation('isStackable');
        testExpectation('attributes');
    });

    describe('/:id/get', function() {
        var method = '/get';
        var payload;

        before(function(done) {
            utils.get(rootUrl, '/' + testItem.id + method, true, addAuth({ }), function(err, result) {
                if (err) return callback(err);
                payload = result;
                done();
            });
        });

        function testExpectation(key) {
            it('should change ' + key, function(done) {
                payload.should.have.property('status');
                payload.status.should.equal('success');
                payload.should.have.property('data');
                payload.data.should.have.property(key);

                if (typeof testItem[key] === 'object') {
                    for (var property in testItem[key]) {
                        payload.data[key].should.have.property(property);
                        payload.data[key][property].toString().should.equal(testItem.attributes[property].toString());
                    }
                }
                else
                    payload.data[key].toString().should.equal(testItem[key].toString());

                done();
            });
        }

        testExpectation('id');
        testExpectation('shortname');
        testExpectation('name');
        testExpectation('description');
        testExpectation('isStackable');
        testExpectation('attributes');
    });

    describe('/find', function() {
        var method = this.title;
        var payload;

        var expected = [ otherTestItem, { }, testItem ];

        before(function(done) {
            utils.get(rootUrl, method, true, addAuth({ shortnames: [ expected[0].shortname, 'NOTAREALSHORTNAME', expected[2].shortname ] }), function(err, result) {
                if (err) return callback(err);
                payload = result;
                // TODO HACK
                if (!payload.data)
                    payload.data = { items: payload.items };
                done();
            });
        });

        it('should return an items array', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            payload.should.have.property('data');
            payload.data.should.have.property('items');
            payload.data.items.should.be.Array();
            done();
        });

        function testExpectation(test, known) {
            for (var property in test) {
                known.should.have.property(property);

                if (typeof test[property] === 'object') {
                    for (var subproperty in test[property]) {
                        known[property].should.have.property(subproperty);
                        known[property][subproperty].toString().should.equal(test[property][subproperty].toString());
                    }
                }
                else {
                    known[property].toString().should.equal(test[property].toString());
                }
            }
        }

        it('should have items[0] match the second created item', function(done) {
            testExpectation(payload.data.items[0], expected[0]);
            done();
        });

        it('should have items[1] be an empty object', function(done) {
            payload.data.items[1].should.be.Object();
            Object.keys(payload.data.items[1]).length.should.equal(0);
            done();
        });

        it('should have items[2] match the first created item', function(done) {
            testExpectation(payload.data.items[2], expected[2]);
            done();
        });
    });

    describe('/list', function() {
        var method = this.title;
        var payload;

        var expected = { };
        var index = { };

        before(function(done) {
            utils.get(rootUrl, method, true, addAuth({ }), function(err, result) {
                if (err) return callback(err);
                payload = result;
                // TODO HACK
                if (!payload.data)
                    payload.data = { items: payload.items };

                expected[testItem.shortname] = testItem;
                expected[otherTestItem.shortname] = otherTestItem;

                done();
            });
        });

        it('should return an items array', function(done) {
            payload.should.have.property('status');
            payload.status.should.equal('success');
            payload.should.have.property('data');
            payload.data.should.have.property('items');
            payload.data.items.should.be.Array();

            for (var i = 0; i < payload.data.items.length; i++) {
                index[payload.data.items[i].shortname] = payload.data.items[i];
            }

            done();
        });

        function testExpectation(test, known) {
            for (var property in test) {
                known.should.have.property(property);

                if (typeof test[property] === 'object') {
                    for (var subproperty in test[property]) {
                        known[property].should.have.property(subproperty);
                        known[property][subproperty].toString().should.equal(test[property][subproperty].toString());
                    }
                }
                else {
                    known[property].toString().should.equal(test[property].toString());
                }
            }
        }

        it('should have an item matching the first created item', function(done) {
            testExpectation(index[testItem.shortname], testItem);
            done();
        });


        it('should have an item matching the second created item', function(done) {
            testExpectation(index[otherTestItem.shortname], otherTestItem);
            done();
        });
    });
});
