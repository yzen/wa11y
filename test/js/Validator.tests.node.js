var testRunner = require("qunit"),
    path = require("path");

testRunner.setup({
    log: {
        summary: true
    }
});

testRunner.run({
    code: {
        path: path.resolve(__dirname, "../../index.js"),
        namespace: "validator"
    },
    tests: [path.resolve(__dirname, "./Validator.tests.js"), path.resolve(__dirname, "./wai-aria.tests.js")]
}, function (err, report) {
    console.dir(report);
});