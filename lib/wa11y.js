var wa11y = require("../wa11y.js"),
  configPath = require('optimist')
    .usage("Usage: $0 --config [path]")
    .options("c", {
      alias: "config",
      "default": "../configs/default.json",
      describe: "Provide config file for wa11y"
    })
    .argv.c;

require("./wa11y.engine.html.js")(wa11y);
require("./utils.js")(wa11y);

wa11y.getConfig(configPath, function (err, config) {
  if (err) {
    throw new TypeError(err);
  }
  wa11y.registerRules("../rules/", function () {
    wa11y.processSrc(config, function () {
      wa11y.init()
        .configure(config)
        .on("complete", function (log) {
          console.log(log);
        })
        .run();
    });
  });
});

module.exports = wa11y;