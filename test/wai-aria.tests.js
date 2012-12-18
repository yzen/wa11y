var wa11y = require("../wa11y.js"),
  expect = require("chai").expect;
require("../lib/wa11y.engine.html.js")(wa11y);
require("../rules/wai-aria.js")(wa11y);
require("./js/wai-aria.tests.js")(wa11y, expect);