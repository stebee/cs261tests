describe('/items', function() {
    var endpoint = this.title;
    var rootUrl = testContext.getRoot() + endpoint;

    var credentials = { };

    console.log(1);

    before(function(done) {
        console.log(2);
        if (!testContext.shouldTest(endpoint))
            this.skip();

        utils.get(rootUrl, '/login', true, { username: testContext.knownAdmin, password: testContext.knownAdminPassword }, function(err, result) {
            console.log(3);
            if (err) return done(err);
            credentials.session = result.data.session;
            credentials.token = result.data.token;
            done();
        });
    });

    describe('Verify admin account', function() {
        console.log(4);
        it('credentials should be present', function(done) {
            console.log(5);
            credentials.should.have.property('session');
            credentials.should.have.property('token');
            done();
        });
    });

    describe('/create', function() {
        var method = this.title;
    });
});
