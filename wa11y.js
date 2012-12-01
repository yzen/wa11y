(function () {

    "use strict";

    var wa11y = function () {};

    // Default test object options.
    wa11y.options = {
        // Report Format.
        format: "json",
        // Severity threshold of log messages.
        severity: "INFO",
        // Types of src files to be tested.
        srcTypes: "*" // "html", "css", ["html", "css"]
    };

    wa11y.isNode = typeof module !== "undefined" && module.exports;

    if (wa11y.isNode) {
        module.exports = wa11y;
    } else {
        window.wa11y = wa11y;
    }

    // A public map of registered rules.
    wa11y.rules = {};

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

    // Lookup an element in an array or an object based on some criteria.
    // source (Object|Array).
    // callback (Function) - evaluation criteria. Stop iteration and
    //     return an element for which callback returns non-undefined.
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

        component.emit = function (event) {
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

    // Wrap a callback function with a wrapper function.
    var wrap = function (callback, wrapper) {
        return wrapper(callback);
    };

    // Merge component options.
    var mergeOptions = function (component) {
        var sources = Array.prototype.slice.apply(arguments).slice(1);
        component.options = component.options || {};
        wa11y.merge.apply(undefined, [component.options].concat(sources));
        return component;
    };

    // Logger creator function.
    wa11y.logger = function (options) {
        var logger = {},
            severities,
            defaultOn;

        mergeOptions(logger, {
            severity: wa11y.options.severity,
            // Full set of default severities.
            severities: ["INFO", "WARNING", "ERROR", "FATAL"]
        }, options);

        // Remove severities below threshold.
        severities = logger.options.severities;
        severities = severities.slice(
            wa11y.indexOf(logger.options.severity, severities)
        );

        eventualize(logger);

        logger.log = function (report) {
            logger.emit("log", report);
            return logger;
        };

        logger.on = wrap(logger.on, function (defaultOn) {
            return function (event, callback) {
                var applyIfNotEmpty;
                if (event !== "log") {
                    defaultOn(event, callback);
                    return logger;
                }
                applyIfNotEmpty = function (report) {
                    // Filter all logs below set severity.
                    var filteredReport = {}, size = 0;
                    wa11y.each(report, function (message, severity) {
                        if (logger.ignore(severity)) {
                            return;
                        }
                        filteredReport[severity] = message;
                        ++size;
                    });
                    if (size > 0) {
                        callback(filteredReport);
                    }
                };
                defaultOn(event, applyIfNotEmpty);
                return logger;
            };
        });

        // Check if severity is below the threshold.
        logger.ignore = function (severity) {
            return wa11y.indexOf(severity, severities) < 0;
        };

        return logger;
    };

    // Test object creator function.
    // It is responsible for testing a source document using the rule passed.
    // rule (Function) - rule to test the document. It can be either
    // synchronous or asynchronous.
    wa11y.test = function (rule, options) {
        var test = {rule: rule},
            logger;

        mergeOptions(test, {
            severity: wa11y.options.severity,
            srcTypes: wa11y.options.srcTypes
        }, options);

        logger = wa11y.logger({
            severity: test.options.severity
        });

        eventualize(test);

        test.on = wrap(test.on, function (defaultOn) {
            return function (event, callback) {
                if (event !== "log") {
                    defaultOn(event, callback);
                    return test;
                }
                logger.on("log", callback);
                return test;
            };
        });

        // Log something during the test.
        test.log = function (report) {
            logger.log(report);
            return test;
        };

        // Complete the test.
        test.complete = function () {
            test.emit.apply(undefined,
                ["complete"].concat(Array.prototype.slice.apply(arguments)));
            return test;
        };

        // Fail the test.
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
                log: test.log,
                options: test.options
            }, options);
            try {
                test.rule.apply(context, [src]);
            } catch (err) {
                test.fail({
                    FATAL: "Error during rule evaluation: " +
                        (err.message || err)
                });
            }
            return test;
        };

        return test;
    };

    // Lightly test if string source might contain html.
    wa11y.isHTML = function (source) {
        return !!source.match(/([\<])([^\>]{1,})*([\>])/i);
    };

    // Lightly test if string source might contain css.
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
        var output = {},
            log = [];

        mergeOptions(output, {
            format: "test.source.severity.json"
        }, options);
        eventualize(output);

        output.on("update", function (report, test, source) {
            wa11y.each(report, function (message, severity) {
                log.push({
                    message: message,
                    severity: severity,
                    test: test,
                    source: source
                });
            });
            return output;
        });

        var buildLog = function (togo, log, segs) {
            var seg = segs.shift();
            togo[seg] = togo[seg] || {};
            if (segs.length > 0) {
                buildLog(togo[seg], log, segs);
            } else {
                togo[seg] = log.message;
            }
        };

        output.print = function () {
            var segs = output.options.format.split("."),
                format = segs.pop(),
                togo = {};
            // TODO: For now support JSON
            if (format !== "json") {
                return;
            }
            wa11y.each(log, function (thisLog) {
                buildLog(togo, thisLog, segs);
            });
            return togo;
        };

        return output;
    };

    wa11y.progress = function () {
        var progress = {
                log: {}
            },
            busy = false,
            completed = {},
            updateLog = function (key, report) {
                wa11y.each(report, function (message, severity) {
                    var keyLog = progress.log[key];
                    if (!keyLog[severity]) {
                        keyLog[severity] = [];
                    }
                    keyLog[severity].push(message);
                });
            };

        eventualize(progress);

        progress.on("log", updateLog);

        progress.isBusy = function () {
            return busy;
        };

        progress.on("start", function (steps) {
            busy = true;
            wa11y.each(steps, function (step, key) {
                progress.log[key] = {};
                completed[key] = false;
                progress.on(key, function (report) {
                    completed[key] = true;
                    updateLog(key, report);
                    if (wa11y.find(completed, function (compl) {
                        if (!compl) {return true;}
                    })) {return;}
                    busy = false;
                    progress.emit("complete", progress.log);
                });
            });
        });

        return progress;
    };

    wa11y.tester = function (rule, options) {
        var tester = {
            options: wa11y.merge({}, options)
        };

        eventualize(tester);

        tester.test = wa11y.test(rule, tester.options.test.options);

        tester.run = function (sources) {
            // TODO: This should be out of this component.
            if (wa11y.isPrimitive(sources)) {
                sources = [sources];
            }
            var progress = wa11y.progress()
                    .emit("start", sources)
                    .on("complete", function (log) {
                        tester.emit("complete", log);
                    }),
                runTest = function (source) {
                    tester.test.run.apply(undefined, [source.src, {
                        srcType: source.srcType,
                        engine: source.engine
                    }]);
                };

            wa11y.each(sources, function (source, index) {
                var engine;

                if (typeof source === "string") {
                    source = sources[index] = {
                        src: source
                    };
                }
                source.srcType = source.srcType || wa11y.getSrcType(source.src);
                if (!source.srcType) {
                    tester.emit("fail", "Source not supported: " + source);
                    return;
                }

                wa11y.each(["complete", "fail"], function (event) {
                    tester.test.on(event, function (report) {
                        progress.emit(index, report);
                    });
                });

                tester.test.on("log", function (report) {
                    progress.emit("log", index, report);
                });

                if (source.engine || !wa11y.engine[source.srcType]) {
                    runTest(source);
                    return;
                }

                engine = wa11y.engine[source.srcType]();
                engine.process(source.src, function (err, engine) {
                    if (engine) {
                        source.engine = engine;
                    }
                    runTest(source);
                });
            });

            return tester;
        };

        return tester;
    };

    // Initialize wa11y object.
    // After initialization user can add listeners to onComplete event
    // and also run tests.
    wa11y.init = function () {
        var runner = {
                options: wa11y.merge({}, wa11y.options)
            },
            testers = {},
            progress = wa11y.progress()
                .on("complete", function (log) {
                    runner.emit("complete", log);
                });

        eventualize(runner);

        // Configure the test runner.
        runner.configure = function (config) {
            runner.options = wa11y.merge(runner.options, config);
            if (!runner.options.rules) {
                return runner;
            }
            wa11y.each(runner.options.rules, function (ruleOptions, name) {
                var ruleObj = wa11y.rules[name],
                    testerObjOpts,
                    testerObj;

                if (!ruleObj) {
                    return;
                }

                testerObjOpts = wa11y.merge({
                    srcTypes: runner.options.srcTypes,
                    severity: runner.options.severity
                }, ruleObj.options, ruleOptions);

                testerObj = {
                    tester: wa11y.tester(ruleObj.rule, {
                        test: {
                            options: testerObjOpts
                        }
                    }),
                    description: ruleObj.description
                };

                wa11y.each(["complete", "fail"], function (event) {
                    testerObj.tester.on(event, function (report) {
                        progress.emit(name, report);
                    });
                });

                testers[name] = testerObj;
            });
            return runner;
        };

        // Test configured rules.
        runner.run = function (sources) {
            if (!sources) {
                runner.emit("fail", "No source supplied.");
                return;
            }
            if (progress.isBusy()) {
                runner.emit("fail", "Tester is in progress. Cancelling...");
                return;
            }
            progress.emit("start", testers);
            wa11y.each(testers, function (testerObj) {
                testerObj.tester.run.apply(undefined, [sources]);
            });
            return runner;
        };

        return runner;
    };

    // Register a rule for testing.
    // * ruleObj Object - an object that contains all rule related
    // configuration:
    //     * name String - a name for the rule.
    //     * description String - a description for the rule.
    //     * rule Function - a rule that will be tested.
    //     * options Object - options object that the rule accepts
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

    // Process source with wa11y selectors engine.
    wa11y.engine.html = function () {
        var engine = {},
            readEngineSource = function (srcPath, callback) {
                require("fs").readFile(require("path").resolve(__dirname, srcPath),
                    "utf-8", callback);
            },
            wrap = function (engine, doc) {
                return {
                    find: function (selector) {
                        return engine(selector, doc);
                    }
                };
            };

        engine.process = function (src, callback) {
            var doc, wrapper;
            if (wa11y.isNode) {
                readEngineSource("./node_modules/sizzle/sizzle.js", function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    require("jsdom").env({
                        html: src,
                        src: data,
                        done: function (err, window) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            wrapper = wrap(window.Sizzle, window.document);
                            callback(undefined, wrapper);
                        }
                    });
                });
            } else {
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
                wrapper = wrap(Sizzle, doc);
                callback(undefined, wrapper);
            }
            return engine;
        };

        return engine;
    };

})();