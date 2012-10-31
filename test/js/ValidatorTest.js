/* global QUnit, ok, test, validator */
(function (QUnit) {

    "use strict;"

    QUnit.module("Validator");

    var simpleSource = "This is source.";
    function simpleRule (source) {
        equal(simpleSource, source, "Source is passed correctly");
    };

    test("Testing Register", function () {
        validator.rules = [];
        equal(0, validator.rules.length, "No rules so far");
        validator.register(simpleRule);
        equal(1, validator.rules.length, "New rule added");
    });

    test("Testing Rules Apply", function () {
        validator.rules = [];
        validator.register(simpleRule);
        validator.applyRules(simpleSource);
    });
    
})(QUnit);