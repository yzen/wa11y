var wa11y = require("../wa11y.js"),
    expect = require("chai").expect;
require("../lib/utils.js")(wa11y);

describe("wally node", function () {
    it("getConfig", function (done) {
        wa11y.getConfig(function (config) {
            expect(config).to.be.deep.equal(require("../configs/default.json"));
            done();
        });
    });
});