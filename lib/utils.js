var fs = require("fs"),
  path = require("path");

module.exports = function (wa11y) {

  // Read config file. If config path is not provided,
  // read default config.
  wa11y.getConfig = function (configPath, callback) {
    var fileName = configPath || process.argv[2] || "../configs/default.json";
    fileName = path.resolve(__dirname, fileName);
    fs.readFile(fileName, "utf8", function (err, data) {
      if (err) {throw err;}
      callback(JSON.parse(data));
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

  /*
var processSource = function (source, src) {
      src = wa11y.makeArray(src);
      source.src = src;
      wa11y.each(src, function (thisSrc, index) {
        var resolved = path.resolve(__dirname, thisSrc);
        
      });
      return src;
    };
  
  wa11y.processSources = function () {
    var sources = {
      common: config.src,
      rules: {}
    };
    if (config.src) {
      processSource(config, config.src);
      return;
    }
    wa11y.each(config.rules, function (rule, name) {
      if (!rule.src) {
        return;
      }
      processSource(rule, rule.src);
    });
    
  };
*/

};