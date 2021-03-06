/*global module*/
(function () {

  "use strict";

  var fs = require("fs"),
    path = require("path"),
    jsdom = require("jsdom");

  var readEngineSource = function (callback) {
    fs.readFile(
      path.resolve(__dirname, "../node_modules/sizzle/sizzle.js"),
      "utf-8", callback);
  };

  // Load process function that will load Sizzle in node in context of the
  // current document.
  module.exports = function (wa11y) {
    wa11y.engine.html.Sizzle = function (src, callback) {
      var process = function (err, data) {
        if (err) {
          callback(err);
          return;
        }
        jsdom.env({
          html: src,
          src: data,
          done: function (err, window) {
            var wrapper;
            if (err) {
              callback(err);
              return;
            }
            wrapper = wa11y.engine.html.init(window.Sizzle, window.document);
            callback(undefined, wrapper);
          }
        });
      };
      readEngineSource(process)
    };
  };

})();