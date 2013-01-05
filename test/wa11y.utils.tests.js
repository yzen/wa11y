var path = require("path"),
  fs = require("fs"),
  wa11y = require("../wa11y.js"),
  expect = require("chai").expect;
require("../lib/utils.js")(wa11y);

describe("wa11y utils", function () {
  var defaultConfigPath = "../configs/default.json",
    defaultConfig = fs.readFileSync(path.resolve(__dirname,
      defaultConfigPath), "utf8"),
    defaultConfigParsed = JSON.parse(defaultConfig),
    thisFilePath = "../test/wa11y.utils.tests.js",
    thisFile = fs.readFileSync(path.resolve(__dirname, thisFilePath), "utf8");

  afterEach(function () {
    delete require.cache[path.resolve(__dirname, "../wa11y.js")];
    wa11y = require("../wa11y.js");
    require("../lib/utils.js")(wa11y);
  });
  it("getConfig valid path", function (done) {
    wa11y.getConfig("../configs/default.json", function (err, config) {
      expect(config).to.be.deep.equal(defaultConfigParsed);
      done();
    });
  });
  it("getConfig invalid path", function (done) {
    wa11y.getConfig("../configs/does_not_exist.json", function (err, config) {
      expect(err).to.be.ok;
      done();
    });
  });
  it("getConfig default path", function (done) {
    wa11y.getConfig(null, function (err, config) {
      expect(config).to.be.deep.equal(defaultConfigParsed);
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

  describe("wa11y fs", function () {
    it("readFile", function (done) {
      wa11y.fs.readFile(defaultConfigPath, function (err, file) {
        expect(file).to.be.equal(defaultConfig);
        done();
      });
    });
    it("readFile from cache", function () {
      wa11y.fs.readFile(defaultConfigPath, function (err, file) {
        expect(file).to.be.equal(defaultConfig);
      });
      wa11y.fs.clearCache();
    });
    it("parseSrc", function () {
      expect(wa11y.fs.parseSrc("../test.json",
        "{test: 1}")).to.be.deep.equal({
          path: "../test.json",
          src: "{test: 1}"
        });
    });
    it("readSrc simple", function (done) {
      var rule = {
        src: defaultConfigPath
      },
        expected = {
          src: [{
            path: defaultConfigPath,
            src: defaultConfig
          }]
        };
      wa11y.fs.readSrc(rule, function () {
        expect(rule).to.be.deep.equal(expected);
        wa11y.fs.clearCache();
        done();
      });
    });
    it("readSrc array", function (done) {
      var rule = {
        src: [defaultConfigPath, thisFilePath]
      },
        expected = {
          src: [{
            path: defaultConfigPath,
            src: defaultConfig
          }, {
            path: thisFilePath,
            src: thisFile
          }]
        };
      wa11y.fs.readSrc(rule, function () {
        expect(rule).to.be.deep.equal(expected);
        wa11y.fs.clearCache();
        done();
      });
    });
    it("expandSrc simple", function (done) {
      var rules = [{
        src: "../*.json"
      }, {
        src: ["../*.json", "../*.md"]
      }, {
        src: ["../bin/*"]
      }],
        expected = [["package.json"], ["package.json", "README.md"],
          ["wa11y"]],
        i = 0;
      wa11y.each(rules, function (rule, index) {
        wa11y.fs.expandSrc(rule, function () {
          wa11y.each(rule.src, function (thisSrc, srcIndex) {
            expect(thisSrc.indexOf(expected[index][srcIndex]) > -1).to.be.ok;
          });
          ++i;
          if (i < rules.length) {
            return;
          }
          done();
        });
      });
    });
  });
});