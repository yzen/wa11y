var fs = require("fs"),
  path = require("path"),
  glob = require("glob"),
  readSrc = {};

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

  // Read source file and add to cache.
  var readFile = function (filePath, callback) {
    var read = readSrc[filePath];
    // If src is already cached, execute the callback.
    if (read) {
      callback(null, read);
      return;
    }
    fs.readFile(filePath, "utf8", function (err, data) {
      if (data) {
        // Add file content to src.
        readSrc[filePath] = data;
      }
      callback(err, data);
    });
  };

  // Parse source path into an expanded object.
  var parseSrc = function (path, src) {
    return {
      path: path,
      src: src
    };
  };

  // Read all sources for the rule. Replace the path with an object
  // containing src and path.
  var readSrc = function (rule, callback) {
    var progres = wa11y.progress()
      .on("complete", callback)
      .on("start", function () {
        // Go over each source, read and then parse it.
        wa11y.each(rule.src, function (path, index) {
          if (!wa11y.isPrimitive(path)) {
            return;
          }
          readFile(path, function (err, src) {
            if (src) {
              rule.src[index] = parseSrc(path, src);
            }
            progress.emit(index);
          });
        })
      })
      .start();
  };

  // Expand all paths specified in rule's src.
  var expandSrc = function (rule, callback) {
    rule.src = wa11y.makeArray(rule.src);
    var togo = [],
      progress = wa11y.progress()
        .on("complete", function () {
          rule.src = togo;
          callback();
        })
        .on("start", function () {
          wa11y.each(rule.src, function (path, index) {
            if (!wa11y.isPrimitive(path)) {
              return;
            }
            // Do the glob search based on the path pattern.
            glob(path, {}, function (err, files) {
              wa11y.each(files, function (file) {
                if (wa11y.indexOf(file, togo) < 0) {
                  return;
                }
                togo.push(file);
              });
              progress.emit(index);
            });
          });
        })
        .start();
  };

  // Process all provided sources.
  wa11y.processSrc = function (config, callback) {
    var progress = wa11y.progress()
      .on("complete", callback)
      .on("start", function () {
        wa11y.each(config.rules, function (rule, name) {
          expandSrc(rule, function () {
            progress.emit(name);
          });
        });
      });

    wa11y.each(config.rules, function (rule, name) {
      rule.src = rule.src || config.src;
    });
    progress.start();

    return wa11y;
  };

};