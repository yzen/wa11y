/* global QUnit, ok, test, wa11y */
(function (QUnit) {

    "use strict;"

    QUnit.module("wai-aria");

    asyncTest("wai-aria Rule Apply", function () {
        QUnit.expect(1);
        var testValidator = wa11y.init();
        testValidator.configure({
            rules: {
                "wai-aria": {}
            }
        });
        testValidator.on("complete", function (log) {
            var key, docId, thisLog;
            for (key in log) {
                for (docId in log[key]) {
                    thisLog = log[key][docId];
                    deepEqual(thisLog, {
                        INFO: ["wai-aria test passed."]
                    }, "Log is correct");
                }
            }
            start();
        });
        testValidator.run('<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>');
    });
    
})(QUnit);