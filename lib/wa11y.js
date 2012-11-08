var wa11y = require("../wa11y.js"),
    fs = require("fs"),
    rulePath = require("path").resolve(__dirname, "../rules/");    // TODO, "./rules/" path should be read from the configuration file 

// Dynamically add all the rules located in the rulePath folder
fs.readdir(rulePath, function(err, files) {
    if (err) {
        console.log(err);
        return;
    }
    files.forEach(function (file) {
        // Check that the file is a JavaScript file
        if (file.split(".").slice(-1)[0].toLowerCase() !== "js") {
            return;
        }
        require([rulePath, file].join("/"))(wa11y);
    });
});
module.exports = wa11y;