var wa11y = require("../wa11y.js"),
    fs = require("fs"),
    path = require("path"),
    rulePath = path.resolve(__dirname, "../rules/");

require("./wa11y.engine.html.js")(wa11y);
require("./utils.js")(wa11y);

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

var runner = wa11y
    .init()
    .configure(config)
    .on("complete", function (log) {
        console.log(log);
    })
    .run(wa11y.processSources());

module.exports = wa11y;