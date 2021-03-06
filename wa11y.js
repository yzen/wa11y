/*global Sizzle, module*/
(function () {

  "use strict";

  var wa11y = function () {},
    env,
    logging = {
      on: false,
      index: false,
      logIndex: 1
    };

  // Default test object options.
  wa11y.options = {
    // Report Format.
    format: "test.source.level.severity.json",
    // Severity threshold of log messages.
    severity: "INFO",
    // Default WCAG level
    level: "A",
    // Types of src files to be tested.
    srcTypes: "*" // "html", "css", ["html", "css"]
  };

  wa11y.isNode = typeof module !== "undefined" && module.exports;

  if (wa11y.isNode) {
    module.exports = wa11y;
    env = {
      wa11y: wa11y
    };
  } else {
    window.wa11y = wa11y;
    env = window;
  }

  // A public map of registered rules.
  wa11y.rules = {};

  // Set wa11y logging.
  wa11y.setLogging = function (logFlag, indexFlag) {
    logging.on = logFlag;
    logging.index = indexFlag;
  };

  // Log using wa11y, only if logging is true.
  wa11y.log = function () {
    if (!logging.on) {
      return;
    }
    var args = Array.prototype.slice.apply(arguments);
    wa11y.each(args, function (arg, index) {
      if (typeof arg === "object") {
        args[index] = JSON.stringify(arg);
      }
    });
    args.unshift("wa11y:");
    if (logging.index) {
      args.unshift(logging.logIndex++ + ":");
    }
    console.log(args.join(" "));
  };
  
  // Iterate over an object or an array.
  // source (Object|Array)
  // callback (Function) - called upon every source element.
  wa11y.each = function (source, callback) {
    var i, key;
    if (wa11y.isArray(source)) {
      for (i = 0; i < source.length; ++i) {
        callback(source[i], i);
      }
    } else {
      for (key in source) {
        callback(source[key], key);
      }
    }
  };

  var getImpl = function (source, segs) {
    var seg;
    if (!source) {
      return;
    }
    seg = segs.shift();
    if (segs.length > 0) {
      return getImpl(source[seg], segs);
    }
    return source[seg];
  };
  // Get a value from an object.
  wa11y.get = function (source, path) {
    if (!source) {
      source = env;
    }
    if (!path) {
      return;
    }
    return getImpl(source, path.split("."));
  };

  // A shortcut for wa11y.get that resolves global paths.
  wa11y.resolve = function (path) {
    return wa11y.get(undefined, path);
  };

  // Make array if it isn't one.
  wa11y.makeArray = function (src) {
    if (typeof src === "undefined") {
      return [];
    }
    return wa11y.isArray(src) ? src : [src];
  };

  // Lookup an element in an array or an object based on some criteria.
  // source (Object|Array).
  // callback (Function) - evaluation criteria. Stop iteration and
  //   return an element for which callback returns non-undefined.
  wa11y.find = function (source, callback) {
    var i, val;
    if (wa11y.isArray(source)) {
      for (i = 0; i < source.length; ++i) {
        val = callback(source[i], i);
        if (val !== undefined) {
          return val;
        }
      }
    } else {
      for (i in source) {
        val = callback(source[i], i);
        if (val !== undefined) {
          return val;
        }
      }
    }
  };

  // Get the index of an element in the array.
  // value (any) - an element of the array to look for.
  // source (Array) - an array to look in.
  wa11y.indexOf = function (value, source) {
    var i;
    if (!wa11y.isArray(source)) {
      return -1;
    }
    for (i = 0; i < source.length; ++i) {
      if (source[i] === value) {
        return i;
      }
    }
    return -1;
  };

  var mergeImpl = function (target, source) {
    var key;
    for (key in source) {
      var thisTarget = target[key],
        thisSource = source[key];
      if (thisSource !== undefined) {
        if (thisSource !== null && typeof thisSource === "object") {
          if (wa11y.isPrimitive(thisTarget)) {
            target[key] = thisTarget =
              wa11y.isArray(thisSource) ? [] : {};
          }
          mergeImpl(thisTarget, thisSource);
        } else {
          target[key] = thisSource;
        }
      }
    }
    return target;
  };

  // Utility primarily used to merge rule options.
  // target (Object|Array) - target to merge into.
  // arguments 1.. (Object|Array) - sources to merge with target.
  wa11y.merge = function (target) {
    var i;
    for (i = 1; i < arguments.length; ++i) {
      var source = arguments[i];
      if (source !== null && source !== undefined) {
        mergeImpl(target, source);
      }
    }
    return target;
  };

  // Test an input value for being an array.
  // obj (Any) - an object to be tested.
  wa11y.isArray = function (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

  // Test if the value is primitive (Function is considered primitive).
  // value (any) - an object to be tested.
  wa11y.isPrimitive = function (value) {
    var type = typeof value;
    return !value || type === "string" || type === "boolean" ||
      type === "number" || type === "function";
  };

  // Test if the value is empty: faulty will return true, array with length 0
  // will return true, object with no options will return true. Otherwise
  // false.
  wa11y.isEmpty = function (value) {
    var key;
    if (!value) {
      return true;
    }
    if (wa11y.isPrimitive(value)) {
      return true;
    }
    if (wa11y.isArray(value)) {
      return value.length < 1;
    }
    for (key in value) {
      if (value[key] !== undefined) {
        return false;
      }
    }
    return true;
  };

  // Emitter creator function.
  // Returns emitter object.
  wa11y.emitter = function () {
    var emitter = {
      // All listeners are stored in listeners object.
      listeners: {}
    };

    // Add a listener to an emitter.
    // type (String) - the name of the event.
    // listener (Function) - listener to be called when event is emitted.
    emitter.on = function (type, listener) {
      var listeners = emitter.listeners[type];
      if (!listeners) {
        emitter.listeners[type] = [];
      }
      emitter.listeners[type].push(listener);
      return emitter;
    };

    // Emit an event.
    // type (String) - the name of the event.
    // arguments 1.. - arguments that are passed to an event listeners.
    emitter.emit = function (type) {
      var args = Array.prototype.slice.apply(arguments).slice(1),
        listeners = emitter.listeners[type];
      if (!listeners) {
        return emitter;
      }
      wa11y.each(listeners, function (listener) {
        listener.apply(emitter, args);
      });
      return emitter;
    };

    return emitter;
  };

  // Add emitter functionality to a component.
  var eventualize = function (component) {
    var emitter = wa11y.emitter();

    component.emit = function () {
      emitter.emit.apply(undefined,
        Array.prototype.slice.apply(arguments));
      return component;
    };

    component.on = function (event, callback) {
      emitter.on(event, callback);
      return component;
    };

    return component;
  };

  // Merge component options.
  var mergeOptions = function (component) {
    var sources = Array.prototype.slice.apply(arguments).slice(1);
    component.options = component.options || {};
    wa11y.merge.apply(undefined, [component.options].concat(sources));
    return component;
  };

  // Make basic component.
  var makeComponent = function (name, options) {
    var component = {},
      cOptions = wa11y.get(wa11y, [name, "options"].join("."));
    mergeOptions(component, cOptions, options);
    return component;
  };

  // Make evented component.
  var makeEventedComponent = function (name, options) {
    var component = makeComponent(name, options);
    eventualize(component);
    return component;
  };

  // Logger creator function.
  wa11y.logger = function (options) {
    var logger = makeEventedComponent("logger", options);

    // Shortcut for logger.emit("log", ...);
    logger.log = function () {
      var args = Array.prototype.slice.apply(arguments);
      logger.emit.apply(undefined, ["log"].concat(args));
      return logger;
    };

    return logger;
  };

  // Test object creator function.
  // It is responsible for testing a source document using the rule passed.
  // rule (Function) - rule to test the document. It can be either
  // synchronous or asynchronous.
  wa11y.test = function (rule, options) {
    var test = makeEventedComponent("test", options);
    test.rule = rule;

    // Shortcut for test.emit("complete", ...);
    test.complete = function (report) {
      test.emit("complete", report);
      return test;
    };

    // Shortcut for test.emit("fail", ...);
    test.fail = function (report) {
      test.emit("fail", report);
      return test;
    };

    // Verify if the source type is supported by the test.
    test.supports = function (srcType) {
      var srcTypes = test.options.srcTypes;
      if (srcTypes === "*") {
        return true;
      }
      if (!srcType) {
        return false;
      }
      if (typeof srcTypes === "string") {
        return srcType === srcTypes;
      }
      return wa11y.indexOf(srcType, test.options.srcTypes) > -1;
    };

    // Run the test.
    test.run = function (src, options) {
      var context = wa11y.merge({
        complete: test.complete,
        options: test.options
      }, options);
      try {
        test.rule.apply(context, [src]);
      } catch (err) {
        test.fail({
          message: "Error during rule evaluation: " +
            (err.message || err),
          severity: "FATAL"
        });
      }
      return test;
    };

    return test;
  };

  // Default test options.
  wa11y.test.options = {
    srcTypes: wa11y.options.srcTypes
  };

  // Test if string source might contain html.
  wa11y.isHTML = function (source) {
    return !!source.match(/([\<])([^\>]{1,})*([\>])/i);
  };

  // Test if string source might contain css.
  wa11y.isCSS = function (source) {
    return !!source.match(/(?:\s*\S+\s*{[^}]*})+/i);
  };

  // Infer source type based on the source string content.
  wa11y.getSrcType = function (source) {
    return wa11y.find(["html", "css"], function (type) {
      if (wa11y["is" + type.toUpperCase()](source)) {
        return type;
      }
    });
  };

  // Output creator function.
  wa11y.output = function (options) {
    var output = makeEventedComponent("output", options),
      log = [];

    output.logger = output.options.logger || wa11y.logger();

    // Check if severity is below the threshold.
    // lSeverity (String) - severity of the log instance.
    // tSeverity (String) - test severity.
    // lLevel (String) - WCAG level of the log instance.
    // tLevel (String) - test WCAG level.
    output.ignore = function (lSeverity, tSeverity, lLevel, tLevel) {
      var severities = ["INFO", "WARNING", "ERROR", "FATAL"],
        levels = ["A", "AA", "AAA"];
      tSeverity = tSeverity || severities[0];
      tLevel = tLevel || levels[0];
      lSeverity = lSeverity || tSeverity;
      lLevel = lLevel || tLevel;
      if (wa11y.indexOf(lLevel, levels) <
        wa11y.indexOf(tLevel, levels)) {
        return true;
      }
      return wa11y.indexOf(lSeverity, severities) <
        wa11y.indexOf(tSeverity, severities);
    };

    // Log everything passed to the log event.
    output.logger.on("log", function (report, test, source) {
      report = wa11y.makeArray(report);
      wa11y.each(report, function (elem) {
        log.push({
          message: elem.message,
          // If test has a default severity - use it.
          severity: elem.severity || test.severity,
          // If test has a default level - use it.
          level: elem.level || test.level,
          test: test,
          source: source
        });
      });
    });

    // Clear the output log.
    output.clear = function () {
      log = [];
    };

    var buildLog = function (togo, log, segs) {
      var seg = segs.shift(),
        segment = log[seg];
      if (seg === "test") {
        segment = segment.name;
      }
      if (seg === "source") {
        segment = segment.srcType;
      }
      if (segs.length < 1) {
        togo[segment] = togo[segment] || [];
        togo[segment].push(log.message);
        return;
      }
      togo[segment] = togo[segment] || {};
      buildLog(togo[segment], log, segs);
    };

    var filterSegs = function (log, segs) {
      var togo = [];
      wa11y.each(segs, function (seg) {
        var segment = log[seg];
        if (!segment) {return;}
        togo.push(seg);
      });
      return togo;
    };

    // Build and return an output.
    output.print = function () {
      var segs = output.options.format.split("."),
        format = segs.pop(),
        togo = {};
      // TODO: For now support JSON
      if (format !== "json") {
        return;
      }
      wa11y.each(log, function (thisLog) {
        if (output.ignore(thisLog.severity,
          thisLog.test.severity, thisLog.level,
          thisLog.test.level)) {
          return;
        }
        buildLog(togo, thisLog, filterSegs(thisLog, segs));
      });
      return togo;
    };

    return output;
  };

  // Default output options.
  wa11y.output.options = {
    format: wa11y.options.format
  };

  wa11y.progress = function (options) {
    var progress = makeEventedComponent("progress", options),
      busy = false,
      completed = {};

    progress.output = progress.options.output || wa11y.output();

    progress.isBusy = function () {
      return busy;
    };

    // Shortcut for progress.emit("start", ...);
    progress.start = function () {
      progress.emit.apply(null,
        ["start"].concat(Array.prototype.slice.apply(arguments)));
      return progress;
    };

    progress.on("start", function (steps) {
      if (wa11y.isEmpty(steps)) {
        progress.emit("complete", progress.output);
        return;
      }
      busy = true;
      wa11y.each(steps, function (step, key) {
        completed[key] = false;
        progress.on(key, function () {
          completed[key] = true;
          if (wa11y.find(completed, function (compl) {
            if (!compl) {return true;}
          })) {return;}
          busy = false;
          progress.emit("complete", progress.output);
        });
      });
    });

    return progress;
  };

  wa11y.tester = function (rule, options) {
    wa11y.log("initializing tester", wa11y.get(options, "name") || "");
    var tester = makeEventedComponent("tester", options),
      log = function (test, source) {
        return function (report) {
          tester.output.logger.log(report, {
            name: tester.options.name,
            description: tester.options.description,
            severity: test.options.severity,
            level: test.options.level
          }, {
            srcType: source.srcType
            // path goes here
          });
        };
      },
      configureTest = function (progress, source, index) {
        // Make actual test.
        var test = wa11y.test(rule, tester.options.test.options);
        wa11y.each(["complete", "fail"], function (event) {
          test.on(event, function (report) {
            wa11y.log("Firing tester's", tester.options.name, "test",
              index, event, "event.");
            report = report || {
              severity: "INFO",
              message: "Complete."
            };
            log(test, source)(report);
            progress.emit(index);
          });
        });
        return test;
      },
      // Run test.
      // source (Object) - a source object to run the test on.
      runTest = function (test, source) {
        wa11y.log("running tester's", tester.options.name, "test. Source:",
          source);
        test.run.apply(undefined, [source.src, {
          srcType: source.srcType,
          engine: source.engine,
          log: log(test, source)
        }]);
      };

    // Make tester output.
    tester.output = tester.options.output || wa11y.output();

    // Run test for all sources.
    // sources (Array) - array of sources.
    tester.run = function (sources) {
      var progress = wa11y.progress({output: tester.output})
        .on("complete", function () {
          wa11y.log("tester", tester.options.name, "is finished.");
          tester.emit("complete", progress.output);
        })
        .on("start", function () {
          wa11y.log("received tester's", tester.options.name,
            "progress' 'START' event.");
          wa11y.each(sources, function (source, index) {
            var engine;
            if (typeof source === "string") {
              source = sources[index] = {src: source};
            }
            source.srcType = source.srcType ||
              wa11y.getSrcType(source.src);

            var test = configureTest(progress, source, index);

            if (!test.supports(source.srcType)) {
              progress.emit(index);
              return;
            }

            if (source.engine) {
              runTest(test, source);
              return;
            }

            engine = wa11y.engine.factory(source.srcType);
            if (!engine) {
              runTest(test, source);
              return;
            }
            engine.process(source.src, function (err, engine) {
              if (engine) {
                source.engine = engine;
              }
              runTest(test, source);
            });
          });
        });
      progress.start(sources);
      return tester;
    };

    return tester;
  };

  // Default tester options.
  wa11y.tester.options = {
    test: {options: undefined}
  };

  // Initialize wa11y object.
  wa11y.init = function () {
    wa11y.log("initialization started.");
    var runner = makeEventedComponent("runner", wa11y.options),
      progress = wa11y.progress()
        .on("complete", function (output) {
          wa11y.log("wa11y is finished", output.print());
          runner.emit("complete", output.print());
        })
        .on("start", function (testers, src) {
          wa11y.log("received wa11y progress' 'START' event");
          wa11y.each(testers, function (tester, name) {
            var testerSrc = src ||
              wa11y.get(tester, "options.test.options.src");
            if (!testerSrc) {
              wa11y.log("firing tester's", name, "'FAIL' event");
              tester.emit("fail", {
                severity: "FATAL",
                message: "No source supplied."
              });
              return;
            }
            testerSrc = wa11y.makeArray(testerSrc);
            tester.run.apply(undefined, [testerSrc]);
        });
      });

    // List of testers.
    runner.testers = {};

    // Configure the test runner.
    // config (Object) - an object of rule name: rule options pairs.
    runner.configure = function (config) {
      wa11y.log("initialization started. Config:", config);
      var rules;

      wa11y.merge(runner.options, config);
      rules = runner.options.rules;

      if (!rules) {return runner;}

      wa11y.each(rules, function (rOptions, name) {
        var rule = wa11y.rules[name],
          tester;

        if (!rule) {return;}

        wa11y.log("creating tester:", name);
        tester = wa11y.tester(rule.rule, {
          name: name,
          description: rule.description,
          output: progress.output,
          test: {
            options: wa11y.merge({}, rule.options, rOptions)
          }
        });

        wa11y.each(["complete", "fail"], function (event) {
          tester.on(event, function () {
            wa11y.log("Firing tester's", name, event, "event.");
            progress.emit(name);
          });
        });

        wa11y.log("adding", name, "to the list of testers");
        runner.testers[name] = tester;
      });
      return runner;
    };

    // Test configured rules.
    // sources (Array|String) - a list|single of source documents to be
    // tested.
    runner.run = function (src) {
      wa11y.log("running wa11y...");
      if (progress.isBusy()) {
        wa11y.log("firing wa11y 'FAIL' event");
        runner.emit("fail", {
          severity: "FATAL",
          message: "Tester is in progress. Cancelling..."
        });
        return;
      }
      progress.output.clear();
      progress.start(runner.testers, src);
      return runner;
    };

    wa11y.log("initialization completed.");
    return runner;
  };

  // Register a rule for testing.
  // * ruleObj Object - an object that contains all rule related
  // configuration:
  //   * name String - a name for the rule.
  //   * description String - a description for the rule.
  //   * rule Function - a rule that will be tested.
  //   * options Object - options object that the rule accepts
  // * Returns a wa11y object.
  wa11y.register = function (ruleObj) {
    if (!ruleObj) {
      return wa11y;
    }
    if (!ruleObj.rule || !ruleObj.name) {
      return wa11y;
    }
    wa11y.rules[ruleObj.name] = {
      rule: ruleObj.rule,
      description: ruleObj.description,
      options: ruleObj.options || {}
    };

    return wa11y;
  };

  wa11y.engine = function () {};
  // This is an engine factory
  wa11y.engine.factory = function (srcType) {
    var srcEngine;
    if (!srcType) {
      return;
    }
    srcEngine = wa11y.engine[srcType];
    if (!srcEngine) {
      return;
    }
    return srcEngine();
  };

  // Default HTML engine.
  wa11y.engine.html = function (options) {
    var engine = makeComponent("engine.html", options);
    engine.process = wa11y.resolve(engine.options.process);
    return engine;
  };

  // Default engine.html options.
  wa11y.engine.html.options = {
    name: "Sizzle",
    process: "wa11y.engine.html.Sizzle"
  };

  wa11y.engine.html.init = function (engine, doc) {
    var wrapper = makeComponent();
    // Find a selector by class, id, tag.
    wrapper.find = function (selector) {
      return engine(selector, doc);
    };
    // Get object's attribute by name.
    wrapper.attr = function (obj, attrName) {
      if (!obj || !obj.attributes) {
        return;
      }
      var attr = obj.attributes.getNamedItem(attrName);
      if (attr) {
        return attr.nodeValue;
      }
    };
    // Trim a string.
    wrapper.trim = function (value) {
      if (typeof value !== "string") {
        return value;
      }
      return value.replace(/^\s+|\s+$/g, "");
    };
    return wrapper;
  };

  wa11y.engine.html.Sizzle = function (src, callback) {
    var doc, wrapper;

    if (src) {
      doc = document.implementation.createHTMLDocument("");
      doc.documentElement.innerHTML = src;
    } else {
      doc = document;
    }
    if (!Sizzle) {
      callback(new Error("Missing selectors engine [Sizzle]."));
      return;
    }
    wrapper = wa11y.engine.html.init(Sizzle, doc);
    callback(undefined, wrapper);
  };

})();