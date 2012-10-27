/* globel QUnit, ok, test, validator */
(function (QUnit) {

    "use strict;"

    test("Testing Identiry Unit", function () {
        var identity = validator.Unit();
        var unit = identity("Hello world.");
        unit.bind(function (val) {
            equal("Hello world.", val, "Proper Identity");
        });
    });

    var simpleSource = "This is source.";
    function simpleRule (source) {
        equal(simpleSource, source, "Source is passed correctly");
    };

    test("Testing Register", function () {
        equal(0, validator.rules.length, "No rules so far");
        validator.register({
            rulue: simpleRule,
            name: "simple"
        });
        equal(1, validator.rules.length, "New rule added");
        validator.rules.pop();
    });

    test("Testing Rules Apply", function () {
        validator.register(simpleRule);
        validator.applyRules(simpleSource);
    });
    
})(QUnit);