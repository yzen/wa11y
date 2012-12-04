var wa11y = require("../wa11y.js"),
    expect = require("chai").expect;
require("../rules/wai-aria.js")(wa11y);
require("./js/wai-aria.tests.js")(wa11y, expect);