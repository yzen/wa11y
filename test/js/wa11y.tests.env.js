/*global wa11y, mocha, chai*/
(function (wa11y, mocha, chai) {

    chai.Assertion.includeStack = true;
    expect = chai.expect;
    mocha.setup({
        ignoreLeaks: true,
        ui: "bdd",
        timeout: 1500
    });
    module = {};
    
})(wa11y, mocha, chai);