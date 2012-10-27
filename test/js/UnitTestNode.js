var testRunner = require("qunit"),
    path = require("path");

testRunner.setup({
    log: {
        summary: true
    }
});

testRunner.run({
    code: {
        path: path.resolve(__dirname, "../../src/Unit.js"),
        namespace: "validator"
    },
    tests: path.resolve(__dirname, "./UnitTest.js")
}, function (err, report) {
    console.dir(report);
});