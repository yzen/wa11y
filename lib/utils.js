var fs = require("fs"),
  path = require("path");

module.exports = function (wa11y) {

  // Read config file.
  wa11y.getConfig = function (configPath, callback) {
    var fileName = configPath;
    fileName = path.resolve(__dirname, fileName);
    fs.readFile(fileName, "utf8", function (err, data) {
      if (data) {
        data = JSON.parse(data);
      }
      callback(err, data);
    });
    return wa11y;
  };

  // Check that the file is a JavaScript file.
  var isJS = function (file) {
    return file.split(".").slice(-1)[0].toLowerCase() === "js";
  };

  // Traverse through the directory with rules and register all of
  // them with wa11y.
  wa11y.registerRules = function (rulesPath, callback) {
    rulesPath = path.resolve(__dirname, rulesPath);
    fs.readdir(rulesPath, function(err, files) {
      if (err) {
        console.log(err);
        return;
      }
      files.forEach(function (file) {
        if (!isJS(file)) {
          return;
        }
        require(path.resolve(rulesPath, file))(wa11y);
      });
      callback();
    });
    return wa11y;
  };

  // Process individual source block.
  var processSrc = function (obj) {
    var src = obj.src = wa11y.makeArray(obj.src);
    // Resolve each src path to an absolute path.
    wa11y.each(src, function (thisSrc, index) {
      var resolved = path.resolve(__dirname, thisSrc);
    });
  };

  // Process all provided sources.
  wa11y.processSrc = function (config, callback) {
    var src = {
      common: config.src,
      rules: {}
    };
    wa11y.each(config.rules, function (rule, name) {
      // Each rule either uses common or its own src option.
      var ruleSrc = src.rules[name] = rule.src || src.common;
      processSrc(ruleSrc);
    });
    return wa11y;
  };

};