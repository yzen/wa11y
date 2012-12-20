var wa11y = require("../wa11y.js");

require("./wa11y.engine.html.js")(wa11y);
require("./utils.js")(wa11y);

var init = function () {
  wa11y.init()
     .configure(config)
     .on("complete", function (log) {
       console.log(log);
     })
     .run(wa11y.processSources());
};

wa11y.registerRules("../rules/", init);
module.exports = wa11y;