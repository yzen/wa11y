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
    }
    var i, filePath, parts, l = files.length;
    for (i = 0; i < l; ++i) {
        parts = files[i].split(".");
        // Check that the file is a JavaScript file
        if (parts.slice(-1)[0].toLowerCase() !== "js") {
            continue;
        }
        // Check that the file is not a node test file
        if (parts.slice(-2)[0].toLowerCase() === "node") {
            continue;
        }
        tests.push([testFolderPath, files[i]].join("/"));
    }

    testRunner.run({
        code: {
            path: path.resolve(__dirname, "../../index.js"),
            namespace: "validator"
        },
        tests: tests
    }, function (err, report) {
        console.dir(report);
    });
});