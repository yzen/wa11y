var path = require("path");
var wa11y = require("../wa11y.js"),
  expect = require("chai").expect;
require("../lib/utils.js")(wa11y);

describe("wally utils", function () {
  it("getConfig", function (done) {
    wa11y.getConfig(function (config) {
      var expectedConfig = require(path.resolve(__dirname,
        "../configs/default.json"));
      debugger;
      expect(config).to.be.deep.equal(expectedConfig);
      done();
    });
  });
});