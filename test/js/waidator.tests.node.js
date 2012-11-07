var testRunner = require("qunit"),
    fs = require("fs"),
    path = require("path");

testRunner.setup({
    log: {
        summary: true
    }
});

// Dynamically generate tests path array
var testFolderPath = path.resolve(__dirname, "."),    // TODO, "." path should be read from the configuration file 
    tests = [];
fs.readdir(testFolderPath, function(err, files) {
    if (err) {
        console.log(err);
        return;
    }
    files.forEach(function (file) {
        var parts = file.split(".");
        // Check that the file is a JavaScript file
        if (parts.slice(-1)[0].toLowerCase() !== "js") {
            return;
        }
        // Check that the file is not a node test file
        if (parts.slice(-2)[0].toLowerCase() === "node") {
            return;
        }
        tests.push([testFolderPath, file].join("/"));
    });

    testRunner.run({
        code: {
            path: path.resolve(__dirname, "../../index.js"),
            namespace: "waidator"
        },
        tests: tests
    }, function (err, report) {
        console.dir(report);
    });
});