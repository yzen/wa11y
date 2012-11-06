var validator = require("./validator.js");

// TODO: for each file in rules, require( rule .js file )
require("./rules/wai-aria.js")(validator);

module.exports = validator;