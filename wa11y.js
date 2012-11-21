(function (module) {

    "use strict";

    var wa11y = function () {};

    if (module.exports) {
        module.exports = wa11y;
    } else {
        module.wa11y = wa11y;
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
        for (var i = 1; i < arguments.length; ++i) {
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

    // Wa11y's logger constructor function.
    wa11y.logger = function (options) {
        options = wa11y.merge({
            severity: wa11y.options.severity
        }, options);
        var logger = {},
            emitter = options.emitter || wa11y.emitter(),
            // Full set of default severities.
            severities = ["INFO", "WARNING", "ERROR", "FATAL"];

        severities = severities.slice(wa11y.indexOf(options.severity,
            severities));

        // Check if severity is below the threshold.
        logger.ignore = function (severity) {
            return wa11y.indexOf(severity, severities) < 0;
        };

        logger.log = function (report) {
            emitter.emit("log", report);
            return logger;
        };

        logger.onLog = function (callback) {
            var callbackWithSeverity = function (report) {
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
            }
            // Only apply callback if severity is appropriate.
            emitter.on("log", callbackWithSeverity);
            return logger;
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
            }),
            // Private test emitter.
            emitter = wa11y.emitter();

        // test.complete - trigger test complete.
        // test.fail - trigger test fail.
        // test.onComplete - listen for test completion.
        // test.onFail - listen for test failure.
        wa11y.each(["complete", "fail"], function (event) {
            test[event] = function (report) {
                emitter.emit(event, report);
                return test;
            };
            test["on" + event.charAt(0).toUpperCase() + event.slice(1)] =
                function (callback) {
                    emitter.on(event, callback);
                    return test;
                };
        });

        // Log something during the test.
        test.log = function (report) {
            logger.log(report);
            return test;
        };

        // Listen to log events.
        test.onLog = function (callback) {
            logger.onLog(callback);
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
        test.run = function (src, srcType) {
            try {
                test.rule.apply({
                    complete: test.complete,
                    log: test.log,
                    srcType: srcType,
                    options: test.options
                }, [src]);
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

    // Initialize wa11y object.
    // After initialization user can add listeners to onComplete event
    // and also run tests.
    wa11y.init = function () {
        var tester = {
                options: wa11y.merge({}, wa11y.options)
            },
            inProgress = false,
            emitter = wa11y.emitter(),
            tests = {},
            log = {};

        // Wrapper around private tester emitter.
        tester.on = function (type, callback) {
            emitter.on(type, callback);
            return tester;
        };

        // Configure the test runner.
        tester.configure = function (config) {
            tester.options = wa11y.merge(tester.options, config);
            if (!tester.options.rules) {
                return tester;
            }
            wa11y.each(tester.options.rules, function (ruleOptions, name) {
                var ruleObj = wa11y.rules[name],
                    testObj,
                    updateLog = function (report) {
                        wa11y.each(report, function (message, severity) {
                            if (!log[name][severity]) {
                                log[name][severity] = [];
                            }
                            log[name][severity].push(message);
                        });
                    };

                if (!ruleObj) {
                    return;
                }

                testObj = {
                    test: wa11y.test(ruleObj.rule, wa11y.merge({
                        srcTypes: tester.options.srcTypes,
                        severity: tester.options.severity
                    }, ruleObj.options, ruleOptions)),
                    description: ruleObj.description
                };

                emitter.on(name, function (report) {
                    testObj.complete = true;
                    updateLog(report);
                    if (wa11y.find(tests, function (testObj) {
                        if (!testObj.complete) {
                            return true;
                        }
                    })) {
                        return;
                    }
                    inProgress = false;
                    emitter.emit("complete", log);
                });

                testObj.test.onLog(updateLog);

                wa11y.each(["onComplete", "onFail"], function (listener) {
                    testObj.test[listener](function (report) {
                        emitter.emit(name, report);
                    });
                });

                tests[name] = testObj;
            });
            return tester;
        };

        // Helper method that prepares wa11y instance for tests.
        var reset = function () {
            wa11y.each(tests, function (testObj, name) {
                log[name] = {};
                testObj.complete = false;
            });
        };

        // Test configured rules.
        tester.run = function (src, srcType) {
            if (inProgress) {
                emitter.emit("cancel", "Tester is in progress. Cancelling...");
                return;
            }
            inProgress = true;
            reset();
            wa11y.each(tests, function (testObj) {
                var test = testObj.test;
                if (!test.supports(srcType)) {
                    return;
                }
                test.run.apply(undefined, [src, srcType]);
            });
            return tester;
        };

        return tester;
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
})(typeof module !== "undefined" && module.exports ? module : this);