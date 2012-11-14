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

    // This is a simple map utility to iterate over an object or an array.
    // source - object or an array.
    // callback - function to be called upon every element of source.
    wa11y.map = function (source, callback) {
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
            wa11y.map(listeners, function (listener) {
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

    // A test object that is responsible for testing source document
    // with the rule passed.
    // rule - is a function that will be applied to source to test the
    // document. It can be both synchronous and asynchronous. It's
    // signature has 1 arguments - src - the actual source document.
    // All it has to do is to call this.complete appropriately.
    wa11y.test = function (rule, options) {
        var test = {
                rule: rule,
                options: wa11y.merge({}, wa11y.testOptions, options)
            },
            emitter = wa11y.emitter();

        // Complete current test.
        test.complete = function (report) {
            emitter.emit("complete", report);
        };

        // Add a listener to the event that fires after test completes.
        test.onComplete = function (callback) {
            emitter.on("complete", callback);
            return test;
        };

        // Verify if the source type is supported by the test.
        test.srcTypeSupported = function (srcType) {
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
            return wa11y.indexOf(srcType) > -1;
        };

        // Run the test.
        test.run = function (src, srcType) {
            try {
                test.rule.apply({
                    complete: test.complete,
                    srcType: srcType,
                    options: test.options
                }, [src]);
            } catch (err) {
                emitter.emit("fail", {
                    message: err.message
                });
            }
            return test;
        };

        return test;
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

    // Initialize wa11y object.
    // After initialization user can add listeners to onComplete event
    // and also run tests.
    wa11y.init = function () {
        var tester = {},
            inProgress = false,
            emitter = wa11y.emitter(),
            completeEmitter = wa11y.emitter(),
            tests = {},
            log = {};

        // Add a listener to the event that is emitted when all rules are
        // tested.
        tester.onComplete = function (callback) {
            completeEmitter.on("complete", callback);
            return tester;
        };

        // Configure the test runner.
        tester.configure = function (config) {
            wa11y.map(config, function (options, name) {
                var ruleObj = wa11y.rules[name],
                    testObj;
                if (!ruleObj) {
                    // TODO: Need generic error handling.
                    console.log(name + " is not registered");
                    return;
                }
                testObj = {
                    test: wa11y.test(ruleObj.rule,
                        wa11y.merge({}, ruleObj.options, options)),
                    description: ruleObj.description
                };
                emitter.on(name, function (report) {
                    // TODO: Need a public event here.
                    var testsComplete = testObj.complete = true;
                    log[name] = report;
                    wa11y.map(tests, function (testObj) {
                        if (testsComplete && !testObj.complete) {
                            testsComplete = false;
                        }
                    });
                    if (testsComplete) {
                        inProgress = false;
                        completeEmitter.emit("complete", log);
                    }
                });
                testObj.test.onComplete(function (report) {
                    emitter.emit(name, report);
                });
                tests[name] = testObj;
            });
            return tester;
        };

        // Test configured rules.
        tester.run = function (src, srcType) {
            if (inProgress) {
                // TODO: Need a public event here.
                return;
            }
            inProgress = true;
            // Reset log.
            log = {};
            // Reset test complete status.
            wa11y.map(tests, function (testObj) {
                testObj.complete = false;
            });
            wa11y.map(tests, function (testObj) {
                var test = testObj.test;
                if (!test.srcTypeSupported(srcType)) {
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