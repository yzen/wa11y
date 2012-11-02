(function (define) {

    "use strict";

    define(["module"], function (module) {

        var validator = function () {},
            // Used for dynamic id generation
            prefix = (Math.floor(Math.random() * 1e12)).toString(36) + "-",
            id = 1;

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
                    rule: rule,
                    complete: false
                },
                emitter = validator.emitter();

            // Test will have 4 public methods:
            // pass and fail that will trigger the corresponding events.
            // whenPass and whenFail let one listen for pass and fail events.
            validator.map(["pass", "fail"], function (result) {
                test[result] = function (report) {
                    test.complete = true;
                    emitter.emit(result, report);
                };
                test["when" + result.charAt(0).toUpperCase() + result.slice(1)] = function (callback) {
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

        // Test if the rule is just a function.
        validator.isSimpleRule = function (rule) {
            return Object.prototype.toString.call(rule) === "[object Function]";
        };

        // Generate unique id.
        validator.id = function () {
            return prefix + (id++);
        };

        var emitter = validator.emitter(),
            completeEmitter = validator.emitter(),
            tests = [],
            log = {};

        // Add a listener to the event that is emitted when all rules are
        // tested.
        validator.whenComplete = function (callback) {
            completeEmitter.on("complete", callback);
            return validator;
        };

        // Register a rule for testing.
        // ruleObj can be either:
        // * Function (named or unnnamed) or
        // * Object with 2 fields: rule (Function) and name (String)
        validator.register = function (ruleObj) {
            var testObj = {},
                rule = ruleObj;

            if (!ruleObj) {
                return validator;
            }
            if (!validator.isSimpleRule(ruleObj)) {
                rule = ruleObj.rule;
            }
            testObj.test = validator.test(rule);
            testObj.name = ruleObj.name || validator.id();

            emitter.on(testObj.name, function (report) {
                var complete = true;
                log[testObj.name] = report;
                validator.map(tests, function (testObj) {
                    if (complete && !testObj.test.complete) {
                        complete = false;
                    }
                });
                if (complete) {
                    completeEmitter.emit("complete", log);
                }
            });

            validator.map(["whenPass", "whenFail"], function (when) {
                testObj.test[when](function (report) {
                    emitter.emit(testObj.name, report);
                });
            });

            tests.push(testObj);

            return validator;
        };

        // Test all rules.
        validator.run = function (source) {
            validator.map(tests, function (testObj) {
                testObj.test.run.apply(undefined, [source]);
            });
        };

        return validator;
        
    });

})(typeof define === "function" && define.amd ? define : function (deps, factory) {
    typeof exports === "object" ? module.exports = factory() : this.validator = factory();
});