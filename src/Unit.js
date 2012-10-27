// Douglas Crockford
// Public Domain

// The Unit function is a macroid that produces monad constructor functions.
// It can take an optional modifier function, which is a function that is
// allowed to modify new monads at the end of the construction processes.

// A monad constructor ("unit") comes with three methods, lift, liftValue,
// and method, all of which can add methods and properties to the monad's prototype.

// A monad has a "bind" method that takes a function that receives a value and
// is usually expected to return a monad.

(function (define) {

    "use strict";

    define(["module"], function (module) {

        function validator () {}

        validator.Unit = function (modifier) {
            var prototype = Object.create(null);
            prototype.isUnit = true;
    
            // Each call to Unit will produce a new unit constructor function.
            // Construct a new unit.
            function unit (value) {
                var monad = Object.create(prototype);
    
                // The bind method will deliver the unit's value parameter to a function.
                // bind takes a function and an optional array of arguments. It calls that
                // function passing the unit's value and bind's optional array of args.
                monad.bind = function (func, args) {
                    return func.apply(undefined,
                        [value].concat(Array.prototype.slice.apply(args || []))
                    );
                };
                // If Unit's modifier parameter is a function, then call it, passing the
                // monad and the value.
                if (typeof modifier === "function") {
                    modifier(monad, value);
                }
                return monad;
            }
    
            // Add a method to the prototype.
            unit.method = function (name, func) {
                prototype[name] = func;
                return unit;
            };
    
            // Add a method to the prototype that calls bind with the func. This can be
            // used for ajax methods that return values other than units.
            unit.liftValue = function (name, func) {
                prototype[name] = function () {
                    return unit.bind(func, arguments);
                };
                return unit;
            };
    
            // Add a method to the prototye that calls bind with the func. If the value
            // returned by the func is not a unit, then make a unit.
            unit.lift = function (name, func) {
                prototype[name] = function () {
                    var result = unit.bind(func, arguments);
                    return result && result.isMonad === true ? result : unit(result);
                };
                return unit;
            };
    
            return unit;
        };

        validator.rules = [];

        validator.register = function (rule, args) {
            var ruleTest = validator.Unit();
            validator.rules.push(function (source) {
                test = ruleTest(source);
                return test.bind(rule, args);
            });
        };

        validator.applyRules = function (source) {
            var i, rule;
            for (i = 0; i < validator.rules.length; ++i) {
                rule = validator.rules[i];
                rule.apply(null, [source]);
            }
        };

        return validator;
        
    });

})(typeof define === "function" && define.amd ? define : function (deps, factory) {
    typeof exports === "object" ? module.exports = factory() : this.validator = factory();
});



//    var identity = MONAD();
//    var monad = identity("Hello world.");
//    monad.bind(alert);

//    var ajax = MONAD()
//        .lift('alert', alert);
//    var monad = ajax("Hello world.");
//    monad.alert();

//    var maybe = MONAD(function (monad, value) {
//        if (value === null || value === undefined) {
//            monad.is_null = true;
//            monad.bind = function () {
//                return monad;
//            };
//        }
//    });
//    var monad = maybe(null);
//    monad.bind(alert);