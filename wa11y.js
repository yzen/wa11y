(function (module) {

    "use strict";

    var wa11y = function () {};

    if (module.exports) {
        module.exports = wa11y;
    } else {
        module.wa11y = wa11y;
    }

    // Used for dynamic id generation
    var prefix = (Math.floor(Math.random() * 1e12)).toString(36) + "-",
        id = 1;

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

    // Generate unique id.
    wa11y.id = function () {
        return prefix + (id++);
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

    // Default test object options.
    wa11y.testOptions = {
        // Report Format.
        format: "json",
        // Severity threshold of log messages.
        severity: "INFO",
        // Types of src files to be tested.
        srcTypes: "*" // "html", "css", ["html", "css"]
    };

    // An object responsible for handling and storing settings related
    // to severity of wa11y's test logging system.
    wa11y.severity = function (severity) {
        var defaultSeverities = ["INFO", "WARNING", "ERROR", "FATAL"],
            severities = defaultSeverities.slice(wa11y.indexOf(severity,
                defaultSeverities));
        severities.ignore = function (severity) {
            return wa11y.indexOf(severity, severities) < 0;
        };
        return severities;
    };

    // A test object that is responsible for testing source document
    // with the rule passed.
    // rule - is a function that will be applied to source to test the
    // document. It can be both synchronous and asynchronous. Its
    // signature has 1 arguments - src - the actual source document.
    wa11y.test = function (rule, options) {
        var test = {
                rule: rule,
                options: wa11y.merge({}, wa11y.testOptions, options)
            },
            // Private test emitter.
            emitter = wa11y.emitter(),
            // Private log severity handler.
            testSeverity = wa11y.severity(test.options.severity);

        // test.log - triggers "log" event.
        // test.complete - triggers "complete" event.
        wa11y.each(["complete", "log"], function (event) {
            test[event] = function (report) {
                emitter.emit(event, report);
            };
        });

        var attachListener = function (event, callback) {
            emitter.on(event, callback);
            return test;
        };

        // Attach a listener to "log" event.
        test.onLog = function (callback) {
            return attachListener("log", function (report) {
                // Filter all logs below test's severity.
                var filteredReport = {}, size = 0;
                wa11y.each(report, function (message, severity) {
                    if (testSeverity.ignore(severity)) {
                        return;
                    }
                    filteredReport[severity] = message;
                    ++size;
                });
                if (size > 0) {
                    callback(filteredReport);
                }
            });
        };

        // Attach a listener to "complete" event.
        test.onComplete = function (callback) {
            return attachListener("complete", callback);
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
                test.log({
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
        var tester = {},
            inProgress = false,
            emitter = wa11y.emitter(),
            tests = {},
            log = {};

        // Wrapper around private tester emitter.
        tester.on = function (type, callback) {
            // TODO: Handle threshold here.
            emitter.on(type, callback);
            return tester;
        };

        // Configure the test runner.
        tester.configure = function (config) {
            wa11y.each(config, function (options, name) {
                var ruleObj = wa11y.rules[name],
                    testObj;
                if (!ruleObj) {
                    emitter.emit("log", {
                        ERROR: name + " is not registered."
                    });
                    return;
                }
                testObj = {
                    test: wa11y.test(ruleObj.rule,
                        wa11y.merge({}, ruleObj.options, options)),
                    description: ruleObj.description
                };
                emitter.on(name, function (report) {
                    var incomplete;
                    testObj.complete = true;
                    log[name] = report;
                    incomplete = wa11y.find(tests, function (testObj) {
                        if (!testObj.complete) {
                            return true;
                        }
                    });
                    if (incomplete) {
                        return;
                    }
                    inProgress = false;
                    emitter.emit("complete", log);
                });
                testObj.test.onLog(function (report) {
                    // Emit better payload.
                    emitter.emit("log", {
                        name: report
                    });
                });
                testObj.test.onComplete(function (report) {
                    emitter.emit(name, report);
                });
                tests[name] = testObj;
            });
            return tester;
        };

        // Helper method that prepares wa11y instance for tests.
        var reset = function () {
            log = {};
            wa11y.each(tests, function (testObj) {
                testObj.complete = false;
            });
            return tester;
        };

        // Test configured rules.
        tester.run = function (src, srcType) {
            if (inProgress) {
                emitter.emit("log", {
                    INFO: "Currently in progress..."
                }).emit("cancel", {
                    INFO: "Cancelling..."
                });
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
        if (!ruleObj.rule) {
            return wa11y;
        }
        wa11y.rules[ruleObj.name || wa11y.id()] = {
            rule: ruleObj.rule,
            description: ruleObj.description,
            options: ruleObj.options || {}
        };

        return wa11y;
    };
})(typeof module !== "undefined" && module.exports ? module : this);