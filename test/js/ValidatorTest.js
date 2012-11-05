/* global QUnit, ok, test, validator */
(function (QUnit) {

    "use strict;"

    QUnit.module("Validator");

    var simpleSource = "This is source.",
        passReport = {
            message: "Source is not empty"
        },
        failReport = {
            message: "Source is empty"
        },
        syncRule = function (test, source) {
            if (source.length > 0) {
                test.pass(passReport)
            } else {
                test.fail(failReport);
            }
        },
        syncRuleRevert = function (test, source) {
            if (source.length < 0) {
                test.pass(passReport)
            } else {
                test.fail(failReport);
            }
        };

    test("validator.emitter", function () {
        var args = ["test1", "test2"];
        QUnit.expect(5);
        var emitter = validator.emitter();
        emitter.on("test1", function () {
            ok("Listener is properly fired");
        });
        emitter.emit("test1");
        emitter.on("test1", function () {
            ok("Both listeners fire");
        });
        emitter.emit("test1");
        emitter.on("test2", function () {
            var i;
            for (i = 0; i < arguments.length; ++i) {
                equal(args[i], arguments[i], "Argument matches");
            }
        });
        emitter.emit.apply(null, ["test1"].concat(args));
    });

    test("validator.test", function () {
        QUnit.expect(2);
        var test = validator.test(syncRule);
        test.onPass(function (report) {
            deepEqual(passReport, report, "Correct pass report");
        });
        test.onFail(function (report) {
            deepEqual(failReport, report, "Correct fail report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("Simple Rule Apply", function () {
        QUnit.expect(1);
        validator.register("syncRule", "Test synchronous rule", syncRule);
        var testValidator = validator.init();
        testValidator.configure({
            syncRule: {}
        });
        testValidator.onComplete(function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(passReport, thisLog, "Log is correct");
            }
        });
        testValidator.run(simpleSource);
    });

    test("Multiple rules apply", function () {
        QUnit.expect(2);
        validator.register("syncRule", "Test synchronous rule", syncRule)
                 .register("syncRuleRevert", "Test synchronous rule revert", syncRuleRevert);
        var testValidator = validator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(key === "syncRule" ? passReport : failReport, thisLog, "Log is correct");
                }
            })
            .run(simpleSource);
    });

    test("Multiple rules applied multiple times (state is good)", function () {
        QUnit.expect(4);
        validator.register("syncRule", "Test synchronous rule", syncRule)
                 .register("syncRuleRevert", "Test synchronous rule revert", syncRuleRevert);
        var testValidator = validator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(key === "syncRule" ? passReport : failReport, thisLog, "Log is correct");
                }
            })
            .run(simpleSource)
            .run(simpleSource);
    });
    
})(QUnit);