var fs = require("fs"),
  path = require("path");

module.exports = function (wa11y) {

  wa11y.getConfig = function (callback) {
    var fileName = process.argv[2] || "../configs/default.json";
    fileName = path.resolve(__dirname, fileName);
    fs.readFile(fileName, "utf8", function (err, data) {
      if (err) {throw err;}
      callback(JSON.parse(data));
    });
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