/* global QUnit, ok, test, wa11ydator */
(function (QUnit) {

    "use strict;"

    QUnit.module("wa11ydator");

    var simpleSource = "This is source.",
        emptySource = "",
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
        syncRuleOptions = function (test, source, options) {
            if (options && options.someOption) {
                test.pass(passReport)
            } else {
                test.fail(failReport);
            }
        },
        syncRuleRevert = function (test, source) {
            if (source.length < 1) {
                test.pass(failReport)
            } else {
                test.fail(passReport);
            }
        };

    test("wa11ydator.merge", function () {
        var testMaterial = {
            targets: [{}, {simple: "old"}, {simple: "old"}, {
                simple: "old", other: "other"}, ["test", {
                simple: "old"}], {test: {nested: ["hello"]}}],

            sources: [[{simple: "simple"}], [{simple: "new"}], [{
                simple: "new"}, {simple: "newer"}], [{other: "new"}],
                [["wow", {other: "new"}]], {test: {nested: {hello: "a"}}}],

            expected: [{simple: "simple"}, {simple: "new"}, {
                simple: "newer"
            }, {simple: "old", other: "new"}, ["wow", {
                other: "new"
            }], {test: {nested: {hello: "a"}}}]
        };
        wa11ydator.map(testMaterial.targets, function (target, index) {
            deepEqual(testMaterial.expected[index],
                wa11ydator.merge.apply(null,
                [target].concat(testMaterial.sources[index])),
                "Merging result is correct");
        });
    });

    test("wa11ydator.emitter", function () {
        var args = ["test1", "test2"];
        QUnit.expect(5);
        var emitter = wa11ydator.emitter();
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

    test("wa11ydator.test", function () {
        QUnit.expect(2);
        var test = wa11ydator.test(syncRule);
        test.onPass(function (report) {
            deepEqual(passReport, report, "Correct pass report");
        });
        test.onFail(function (report) {
            deepEqual(failReport, report, "Correct fail report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("wa11ydator.test with options", function () {
        QUnit.expect(2);
        var test = wa11ydator.test(syncRuleOptions, {
            someOption: "rule option"
        });
        test.onPass(function (report) {
            deepEqual(passReport, report, "Correct pass report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("Simple Rule Apply", function () {
        QUnit.expect(1);
        wa11ydator.register({
            name: "syncRule",
            description: "Test synchronous rule",
            rule: syncRule
        });
        var testValidator = wa11ydator.init();
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

    test("Simple Sync Rule with Options Apply", function () {
        QUnit.expect(1);
        wa11ydator.register({
            name: "syncRuleOptions",
            description: "Test synchronous rule with options",
            rule: syncRuleOptions
        });
        var testValidator = wa11ydator.init();
        testValidator.configure({
            syncRuleOptions: {
                someOption: "some option"
            }
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
        wa11ydator.register({
            name: "syncRule",
            description: "Test synchronous rule",
            rule: syncRule
        }).register({
            name: "syncRuleRevert",
            description: "Test synchronous rule revert",
            rule: syncRuleRevert
        });
        var testValidator = wa11ydator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(passReport, thisLog, "Log is correct");
                }
            })
            .run(simpleSource);
    });

    test("Multiple rules applied multiple times (state is scoped to a particular validator)", function () {
        QUnit.expect(4);
        var testValidator = wa11ydator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(passReport, thisLog, "Log is correct");
                }
            })
            .run(simpleSource)
            .run(simpleSource);
    });

    test("Multiple testers", function () {
        QUnit.expect(4);
        var validator1 = wa11ydator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(passReport, thisLog, "Log is correct");
                }
            }),
            validator2 = wa11ydator.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(failReport, thisLog, "Log is correct");
                }
            });
        validator1.run(simpleSource);
        validator2.run(emptySource);
    });
    
})(QUnit);