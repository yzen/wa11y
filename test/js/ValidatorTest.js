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
        simpleRule = function simpleRule (source) {
            equal(simpleSource, source, "Source is passed correctly");
        },
        syncRule = function (test, source) {
            if (source.length > 0) {
                test.pass(passReport)
            } else {
                test.fail(failReport);
            }
        };

    test("validator.isSimpleRule", function () {
        var tests = [{}, function () {}, "test", 1, null, undefined, NaN],
            expected = [false, true, false, false, false, false, false, false],
            i;
        for (i = 0; i < tests.length; ++i) {
            equal(expected[i], validator.isSimpleRule(tests[i]), "Simple rule is correctly identified");
        }
    });

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
        test.whenPass(function (report) {
            deepEqual(passReport, report, "Correct pass report");
        });
        test.whenFail(function (report) {
            deepEqual(failReport, report, "Correct fail report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("Simple Rule Apply", function () {
        QUnit.expect(1);
        validator.register(syncRule);
        validator.whenComplete(function (log) {
            validator.map(log, function (thisLog) {
                deepEqual(passReport, thisLog, "Log is correct");
            });
        });
        validator.run(simpleSource);
    });
    
})(QUnit);