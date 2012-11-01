(function (define) {

    "use strict";

    define(["module"], function (module) {

        var validator = {
            rules: []
        };

        validator.emitter = function () {
            var emitter = {
                listeners: {}
            };

            emitter.on = function (type, listener) {
                var listeners = emitter.listeners[type];
                if (!listeners) {
                    emitter.listeners[type] = [];
                }
                emitter.listeners[type].push(listener);
                return emitter;
            };

            emitter.emit = function (type) {
                var args = Array.prototype.slice.apply(arguments).slice(1),
                    listeners = emitter.listeners[type],
                    i;
                if (!listeners) {
                    return emitter;
                }
                for (i = 0; i < listeners.length; ++i) {
                    listeners[i].apply(emitter, args);
                }
                return emitter;
            };

            return emitter;
        };

        // Sample rule
        // function someRule (test, source) {
        //     if (source sucks) {
        //          test.pass({
        //              fail: true, // or not
        //              ...
        //          });
        //     } else {
        //          test.fail({
        //              pass: true // or not
        //          });
        //     }
        // }
        //
        // Complicated
        // function craze (test, source) {
        //     $.ajax({
        //          success: function () {
        //              test.pass({...})
        //          },
        //          error: function () {
        //              test.fail({...})
        //          }
        //     })
        // }

        validator.test = function (rule) {
            var test = {
                    rule: rule,
                },
                emitter = validator.emitter();

            test.pass = function (report) {
                emitter.emit("pass", report);
            };

            test.whenPass = function (passback) {
                emitter.on("pass", passback);
                return test;
            };

            test.fail = function (report) {
                emitter.emit("fail", report);
            };

            test.whenFail = function (failback) {
                emitter.on("fail", failback);
                return test;
            };

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

        validator.isSimpleRule = function (rule) {
            return Object.prototype.toString.apply(rule) === "[object Function]";
        };

        validator.register = function (rule) {
            validator.rules.push(function (source) {
                return rule.apply(undefined, [source]);
            });
        };

        validator.applyRules = function (source) {
            var i, rule;
            for (i = 0; i < validator.rules.length; ++i) {
                rule = validator.rules[i];
                rule.apply(undefined, [source]);
            }
        };

        return validator;
        
    });

})(typeof define === "function" && define.amd ? define : function (deps, factory) {
    typeof exports === "object" ? module.exports = factory() : this.validator = factory();
});