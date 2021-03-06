var fs = require("fs"),
  path = require("path"),
  glob = require("glob"),
  optimist = require("optimist"),
  readSrc = {};

module.exports = function (wa11y) {

  var argv = require("optimist").argv;

  wa11y.setLogging(argv.v, argv.i);

  // Read config file.
  wa11y.getConfig = function (configPath, callback) {
    var fileName = configPath || argv.config || "../configs/default.json";
    fileName = path.resolve(__dirname, fileName);
    // Here we assume that if paths in config are relative they are relative
    // to the config file itself.
    wa11y.fs.root = path.dirname(fileName);
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
    return path.extname(file) === ".js";
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

  wa11y.fs = {
    // All relative paths will be resolved against the root.
    root: __dirname
  };

  // Clear cached files.
  wa11y.fs.clearCache = function () {
    readSrc = {};
    return wa11y;
  };

  // Read source file and add to cache.
  wa11y.fs.readFile = function (filePath, callback) {
    // Resolve path against the root (e.g. config filedir).
    filePath = path.resolve(wa11y.fs.root, filePath);
    var read = readSrc[filePath];
    // If src is already cached, execute the callback.
    if (read) {
      callback(null, read);
      return wa11y;
    }
    fs.readFile(filePath, "utf8", function (err, data) {
      if (data) {
        // Add file content to src.
        readSrc[filePath] = data;
      }
      callback(err, data);
    });
    return wa11y;
  };

  // Parse source path into an expanded object.
  wa11y.fs.parseSrc = function (path, src) {
    return {
      path: path,
      src: src
    };
  };

  // Read all sources for the rule. Replace the path with an object
  // containing src and path.
  wa11y.fs.readSrc = function (rule, callback) {
    rule.src = wa11y.makeArray(rule.src);
    var progress = wa11y.progress()
      .on("complete", callback)
      .on("start", function () {
        // Go over each source, read and then parse it.
        wa11y.each(rule.src, function (srcPath, index) {
          if (!wa11y.isPrimitive(srcPath)) {
            return;
          }
          wa11y.fs.readFile(srcPath, function (err, src) {
            if (src) {
              rule.src[index] = wa11y.fs.parseSrc(srcPath, src);
            }
            progress.emit(index);
          });
        })
      })
      .start(rule.src);
    return wa11y;
  };

  // Expand all paths specified in rule's src.
  wa11y.fs.expandSrc = function (rule, callback) {
    rule.src = wa11y.makeArray(rule.src);
    var togo = [],
      progress = wa11y.progress()
        .on("complete", function () {
          rule.src = togo;
          callback();
        })
        .on("start", function () {
          wa11y.each(rule.src, function (srcPath, index) {
            if (!wa11y.isPrimitive(srcPath)) {
              return;
            }
            srcPath = path.resolve(wa11y.fs.root, srcPath);
            // Do the glob search based on the path pattern.
            glob(srcPath, {}, function (err, files) {
              wa11y.each(files, function (file) {
                if (wa11y.indexOf(file, togo) > -1) {
                  return;
                }
                togo.push(file);
              });
              progress.emit(index);
            });
          });
        })
        .start(rule.src);
    return wa11y;
  };

  // Process all provided sources.
  wa11y.processSrc = function (config, callback) {
    var rules = config.rules;
    wa11y.each(rules, function (rule, name) {
      rule.src = rule.src || config.src;
    });
    var readProgress = wa11y.progress()
      .on("complete", callback)
      .on("start", function () {
        wa11y.each(rules, function (rule, name) {
          wa11y.fs.readSrc(rule, function () {
            readProgress.emit(name);
          });
        });
      }),
      expandProgress = wa11y.progress()
        .on("complete", function () {
          readProgress.start(rules);
        })
        .on("start", function () {
          wa11y.each(rules, function (rule, name) {
            wa11y.fs.expandSrc(rule, function () {
              expandProgress.emit(name);
            });
          });
        });

    expandProgress.start(rules);
    return wa11y;
  };

};