var testRunner = require("qunit"),
    path = require("path");

testRunner.setup({
    log: {
        summary: true
    }
});

testRunner.run({
    code: {
        path: path.resolve(__dirname, "../../Validator.js"),
        namespace: "validator"
    },
    tests: path.resolve(__dirname, "./ValidatorTest.js")
}, function (err, report) {
    console.dir(report);
});