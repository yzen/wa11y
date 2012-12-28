var path = require("path");
var wa11y = require("../wa11y.js"),
  expect = require("chai").expect;
require("../lib/utils.js")(wa11y);

describe("wally utils", function () {
  afterEach(function () {
    delete require.cache[path.resolve(__dirname, "../wa11y.js")];
    wa11y = require("../wa11y.js");
    require("../lib/utils.js")(wa11y);
  });
  it("getConfig valid path", function (done) {
    wa11y.getConfig("../configs/default.json", function (err, config) {
      var expectedConfig = require(path.resolve(__dirname,
        "../configs/default.json"));
      expect(config).to.be.deep.equal(expectedConfig);
      done();
    });
  });
  it("getConfig invalid path", function (done) {
    wa11y.getConfig("../configs/does_not_exist.json", function (err, config) {
      expect(err).to.be.ok;
      done();
    });
  });
  it("registerRules", function (done) {
    var defaultRules = ["wai-aria"];
    wa11y.each(defaultRules, function (ruleName) {
      expect(wa11y.rules[ruleName]).to.not.be.ok;
    });
    wa11y.registerRules("../rules/", function () {
      wa11y.each(defaultRules, function (ruleName) {
        expect(wa11y.rules[ruleName]).to.be.ok;
      });
      done();
    });
  });
});