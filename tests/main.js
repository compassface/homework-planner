var wd = require('wd');
require('colors');
var _ = require("lodash");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// checking sauce credential
if(!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY){
    console.warn(
        '\nPlease configure your sauce credential:\n\n' +
        'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
        'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
    );
    throw new Error("Missing sauce credentials");
}

// http configuration, not needed for simple runs
wd.configureHttp( {
    timeout: 60000,
    retryDelay: 15000,
    retries: 5
});

var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'homework planner';
var pr_tag = process.env.TRAVIS_PULL_REQUEST || 'local test';
var pr_branch = process.env.TRAVIS_BRANCH || 'local branch';
desired.tags = [pr_tag, pr_branch];
desired.build = process.env.TRAVIS_BUILD_NUMBER || 'local build';

describe(desired.browserName, function() {
    var browser;
    var allPassed = true;

    before(function(done) {
        var username = process.env.SAUCE_USERNAME;
        var accessKey = process.env.SAUCE_ACCESS_KEY;
        browser = wd.promiseChainRemote("testing2.emersonveenstra.net", 4445, username, accessKey);
        //if(process.env.VERBOSE){
            // optional logging     
            browser.on('status', function(info) {
                console.log(info.cyan);
            });
            browser.on('command', function(meth, path, data) {
                console.log(' > ' + meth.yellow, path.grey, data || '');
            });            
        //}
        browser
            .init(desired)
            .nodeify(done);
    });

    afterEach(function(done) {
        allPassed = allPassed && (this.currentTest.state === 'passed');  
        done();
    });

    after(function(done) {
        browser
            .quit()
            .sauceJobStatus(allPassed)
            .nodeify(done);
    });

    it("should get home page title", function(done) {
        browser
            .get("localhost:5672")
            .title()
            .should.become("Homework Planner | Hello World")
            .nodeify(done);
    });

    it("should get correct h1", function(done) {
        browser
            .get("localhost:5672")
            .elementByTagName("h1")
            .text()
            .should.eventually.include('Hello World')
            .nodeify(done);
    });
});