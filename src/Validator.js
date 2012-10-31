(function (define) {

    "use strict";

    define(["module"], function (module) {

        function validator () {}

        validator.rules = [];

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