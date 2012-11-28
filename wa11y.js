(function () {

    "use strict";

    var wa11y = function () {};

    wa11y.isNode = typeof module !== "undefined" && module.exports;

    if (wa11y.isNode) {
        module.exports = wa11y;
    } else {
        window.wa11y = wa11y;
    }

    // A public map of registered rules.
    wa11y.rules = {};

    // This is a simple utility to iterate over an object or an array.
    // source - object or an array.
    // callback - function to be called upon every element of source.
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

    // Lookup an element in an array or object based on some criteria.
    // source - object or an array.
    // callback - criteria function.
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

    // This is a utility to get the index of an element in the array.
    // value - an element of the array to look for.
    // source Array - an array to look in.
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

    // Remove elements from an array or object based on some criteria.
    // source - object or an array.
    // callback - criteria.
    wa11y.remove = function (source, callback) {
        var i;
        if (wa11y.isArray(source)) {
            for (i = 0; i < source.length; ++i) {
                if (callback(source[i], i)) {
                    source.splice(i, 1);
                    --i;
                }
            }
        } else {
            for (i in source) {
                if (callback(source[i], i)) {
                    delete source[i];
                }
            }
        }
        return source;
    };

    var mergeImpl = function (target, source) {
        var key;
        for (key in source) {
            var thisTarget = target[key],
                thisSource = source[key];
            if (thisSource !== undefined) {
                if (thisSource !== null && typeof thisSource === "object") {
                    if (wa11y.isPrimitive(thisTarget)) {
                        target[key] = thisTarget = wa11y.isArray(thisSource) ? [] : {};
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
    wa11y.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    // Test if the value is primitive (Function is considered primitive).
    wa11y.isPrimitive = function (value) {
        var type = typeof value;
        return !value || type === "string" || type === "boolean" || type === "number" || type === "function";
    };

    // This is a wa11y's emitter constructor function.
    wa11y.emitter = function () {
        var emitter = {
            // All listeners are stored in listeners object.
            listeners: {}
        };

        // Add a listener to an emitter.
        // type - the name of the event to listen to.
        // listener - a function that will be called when event is emitted.
        emitter.on = function (type, listener) {
            var listeners = emitter.listeners[type];
            if (!listeners) {
                emitter.listeners[type] = [];
            }
            emitter.listeners[type].push(listener);
            return emitter;
        };

        // Emit an event.
        // type - the name of the event.
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

    var eventualize = function (component) {
        var emitter = wa11y.emitter();

        component.emit = function (event) {
            emitter.emit.apply(undefined, Array.prototype.slice.apply(arguments));
            return component;
        };

        component.on = function (event, callback) {
            emitter.on(event, callback);
            return component;
        };

        return component;
    };

    var wrap = function (callback, wrapper) {
        return wrapper(callback);
    };

    // Wa11y's logger constructor function.
    wa11y.logger = function (options) {
        var logger = {
                options: wa11y.merge({
                    severity: wa11y.options.severity,
                    // Full set of default severities.
                    severities: ["INFO", "WARNING", "ERROR", "FATAL"]
                }, options)
            },
            severities = logger.options.severities,
            defaultOn;

        severities = severities.slice(wa11y.indexOf(logger.options.severity,
            severities));

        eventualize(logger);

        logger.on = wrap(logger.on, function (defaultOn) {
            return function (event, callback) {
                if (event !== "log") {
                    defaultOn(event, callback);
                    return logger;
                }
                defaultOn(event, function (report) {
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
                });
                return logger;
            };
        });

        // Check if severity is below the threshold.
        logger.ignore = function (severity) {
            return wa11y.indexOf(severity, severities) < 0;
        };

        return logger;
    };

    // Default test object options.
    wa11y.options = {
        // Report Format.
        format: "json",
        // Severity threshold of log messages.
        severity: "INFO",
        // Types of src files to be tested.
        srcTypes: "*" // "html", "css", ["html", "css"]
    };

    // A test object that is responsible for testing source document
    // with the rule passed.
    // rule - is a function that will be applied to source to test the
    // document. It can be both synchronous and asynchronous. Its
    // signature has 1 arguments - src - the actual source document.
    wa11y.test = function (rule, options) {
        var test = {
                rule: rule,
                options: wa11y.merge({
                    severity: wa11y.options.severity,
                    srcTypes: wa11y.options.srcTypes
                }, options)
            },
            // Private logger.
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
            logger.emit("log", report);
            return test;
        };

        test.complete = function () {
            test.emit.apply(undefined, ["complete"].concat(Array.prototype.slice.apply(arguments)));
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
            try {
                test.rule.apply(wa11y.merge({
                    complete: test.complete,
                    log: test.log,
                    options: test.options
                }, options), [src]);
            } catch (err) {
                test.emit("fail", {
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

    // Lightly test if string source might contain html.
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
            var progress = wa11y.progress(),
                runTest = function (source) {
                    tester.test.run.apply(undefined, [source.src, {
                        srcType: source.srcType,
                        engine: source.engine
                    }]);
                };

            progress.emit("start", sources);

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

                progress.on("complete", function (log) {
                    tester.emit("complete", log);
                });

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
            progress = wa11y.progress();

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

                progress.on("complete", function (log) {
                    runner.emit("complete", log);
                });

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