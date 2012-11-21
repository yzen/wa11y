/* global QUnit, ok, test, wa11y */
(function (QUnit) {

    "use strict;"

    QUnit.module("wai-aria");

    test("wai-aria Rule Apply", function () {
        QUnit.expect(1);
        var testValidator = wa11y.init();
        testValidator.configure({
            rules: {
                "wai-aria": {}
            }
        });
        testValidator.on("complete", function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, {
                    message: ["wai-aria test passed."]
                }, "Log is correct");
            }
        });
        testValidator.run("Plain text source");
    });
    
})(QUnit);