(function (module) {

    "use strict";

    var validator = function () {};

    if (module.exports) {
        module.exports = validator;
    } else {
        module.validator = validator;
    }

    // Used for dynamic id generation
    var prefix = (Math.floor(Math.random() * 1e12)).toString(36) + "-",
        id = 1;

    // A public map of registered rules.
    validator.rules = {};

    // This is a simple map utility to iterate over an object or an array.
    // source - object or an array.
    // callback - function to be called upon every element of source.
    validator.map = function (source, callback) {
        var i, key;
        if (validator.isArray(source)) {
            for (i = 0; i < source.length; ++i) {
                callback(source[i], i);
            }
        } else {
            for (key in source) {
                callback(source[key], key);
            }
        }
    };

    // This is a validator's emitter constructor function.
    validator.emitter = function () {
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
            validator.map(listeners, function (listener) {
                listener.apply(emitter, args);
            });
            return emitter;
        };

        return emitter;
    };

    // A test object that is responsible for testing source document
    // with the rule passed.
    // rule - is a function that will be applied to source to test the
    // document. It can be both synchronous and asynchronous. It's
    // signature has 2 arguments - test (test object itself) and source -
    // the actual source document. All it has to do is to call test
    // test.pass or test.fail appropriately.
    validator.test = function (rule) {
        var test = {
                rule: rule
            },
            emitter = validator.emitter();

        // Test will have 4 public methods:
        // pass and fail that will trigger the corresponding events.
        // onPass and onFail let one listen for pass and fail events.
        validator.map(["pass", "fail"], function (result) {
            test[result] = function (report) {
                emitter.emit(result, report);
            };
            test["on" + result.charAt(0).toUpperCase() + result.slice(1)] =
                function (callback) {
                    emitter.on(result, callback);
                    return test;
                };
        });

        // Run the test.
        test.run = function (source) {
            try {
                test.rule.apply(undefined, [test, source]);
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
    validator.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    // Generate unique id.
    validator.id = function () {
        return prefix + (id++);
    };

    // Initialize validator object.
    // After initialization user can add listeners to onComplete event
    // and also run tests.
    validator.init = function () {
        var tester = {},
            emitter = validator.emitter(),
            completeEmitter = validator.emitter(),
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
            validator.map(config, function (options, name) {
                var ruleObj = validator.rules[name],
                    testObj;
                if (!ruleObj) {
                    // TODO: Need generic error handling.
                    console.log(name + " is not registered");
                    return;
                }
                testObj = {
                    test: validator.test(ruleObj.rule),
                    description: ruleObj.description
                };
                emitter.on(name, function (report) {
                    var testsComplete = testObj.complete = true;
                    log[name] = report;
                    validator.map(tests, function (testObj) {
                        if (testsComplete && !testObj.complete) {
                            testsComplete = false;
                        }
                    });
                    if (testsComplete) {
                        completeEmitter.emit("complete", log);
                    }
                });
                validator.map(["onPass", "onFail"], function (on) {
                    testObj.test[on](function (report) {
                        emitter.emit(name, report);
                    });
                });
                tests[name] = testObj;
            });
            return tester;
        };

        // Test configured rules.
        tester.run = function (source) {
            // Reset log.
            log = {};
            // Reset test complete status.
            validator.map(tests, function (testObj) {
                testObj.complete = false;
            });
            validator.map(tests, function (testObj) {
                testObj.test.run.apply(undefined, [source]);
            });
            return tester;
        };

        return tester;
    };

    // Register a rule for testing.
    // * name String - a name for the rule.
    // * description String - a description for the rule.
    // * rule Function - a rule that will be tested.
    // * Returns a validator object.
    validator.register = function (name, description, rule) {
        if (!rule) {
            return validator;
        }

        validator.rules[name || validator.id()] = {
            rule: rule,
            description: description
        };

        return validator;
    };
})(typeof module !== "undefined" && module.exports ? module : this);