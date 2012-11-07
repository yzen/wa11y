var validator = require("./validator.js"),
    fs = require("fs"),
    rulePath = require("path").resolve(__dirname, "./rules/");    // TODO, "./rules/" path should be read from the configuration file 

// Dynamically add all the rules located in the rulePath folder
fs.readdir(rulePath, function(err, files) {
    if (err) {
        return console.log(err);
    }
    var i, l = files.length;
    for (i = 0; i < l; ++i) {
        // Check that the file is a JavaScript file
        if (files[i].split(".").slice(-1)[0].toLowerCase() !== "js") {
            continue;
        }
        require([rulePath, files[i]].join("/"))(validator);
    }
});
module.exports = validator;