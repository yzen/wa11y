var wa11y = require("../wa11y.js"),
  configPath = process.argv[2] || "../configs/default.json",
  config;

require("./wa11y.engine.html.js")(wa11y);
require("./utils.js")(wa11y);

var afterConfig = function (err, conf) {
  if (err) {
    throw new TypeError(err);
  }
  config = conf;
  wa11y.registerRules("../rules/", afterRegisterRules);
};

var afterRegisterRules = function () {
  wa11y.init()
     .configure(config)
     .on("complete", function (log) {
       console.log(log);
     })
     .run(wa11y.processSources());
};

wa11y.getConfig(configPath, afterConfig);

module.exports = wa11y;