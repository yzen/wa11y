/* global QUnit, ok, test, validator */
(function (QUnit) {

    "use strict;"

    QUnit.module("wai-aria");

    test("wai-aria Rule Apply", function () {
        QUnit.expect(1);
        var testValidator = validator.init();
        testValidator.configure({
            "wai-aria": {}
        });
        testValidator.onComplete(function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual({
                    message: "wai-aria test passed."
                }, thisLog, "Log is correct");
            }
        });
        testValidator.run("Plain text source");
    });
    
})(QUnit);