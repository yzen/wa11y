/* global QUnit, ok, test, wa11y */
(function (QUnit) {

    "use strict;"

    QUnit.module("wa11y");

    var simpleSource = "This is source.",
        emptySource = "",
        passReport = {
            message: "Source is not empty"
        },
        failReport = {
            message: "Source is empty"
        },
        syncRule = function (src) {
            if (src.length > 0) {
                this.pass(passReport)
            } else {
                this.fail(failReport);
            }
        },
        syncRuleOptions = function (src, options) {
            if (options && options.someOption) {
                this.pass(passReport)
            } else {
                this.fail(failReport);
            }
        },
        syncRuleRevert = function (src) {
            if (src.length < 1) {
                this.pass(failReport)
            } else {
                this.fail(passReport);
            }
        };

    test("wa11y.merge", function () {
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
                other: "new",
                simple: "old"
            }], {test: {nested: ["hello"]}}]
        };
        wa11y.map(testMaterial.targets, function (target, index) {
            deepEqual(wa11y.merge.apply(null,
                [target].concat(testMaterial.sources[index])),
                testMaterial.expected[index],
                "Merging result is correct");
        });
    });

    test("wa11y.emitter", function () {
        var args = ["test1", "test2"];
        QUnit.expect(5);
        var emitter = wa11y.emitter();
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
                equal(arguments[i], args[i], "Argument matches");
            }
        });
        emitter.emit.apply(null, ["test1"].concat(args));
    });

    test("wa11y.test", function () {
        QUnit.expect(2);
        var test = wa11y.test(syncRule);
        test.onPass(function (report) {
            deepEqual(report, passReport, "Correct pass report");
        });
        test.onFail(function (report) {
            deepEqual(report, failReport, "Correct fail report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("wa11y.test with options", function () {
        QUnit.expect(2);
        var test = wa11y.test(syncRuleOptions, {
            someOption: "rule option"
        });
        test.onPass(function (report) {
            deepEqual(report, passReport, "Correct pass report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    test("Simple Rule Apply", function () {
        QUnit.expect(1);
        wa11y.register({
            name: "syncRule",
            description: "Test synchronous rule",
            rule: syncRule
        });
        var testValidator = wa11y.init();
        testValidator.configure({
            syncRule: {}
        });
        testValidator.onComplete(function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, passReport, "Log is correct");
            }
        });
        testValidator.run(simpleSource);
    });

    test("Simple Sync Rule with Options Apply", function () {
        QUnit.expect(1);
        wa11y.register({
            name: "syncRuleOptions",
            description: "Test synchronous rule with options",
            rule: syncRuleOptions
        });
        var testValidator = wa11y.init();
        testValidator.configure({
            syncRuleOptions: {
                someOption: "some option"
            }
        });
        testValidator.onComplete(function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, passReport, "Log is correct");
            }
        });
        testValidator.run(simpleSource);
    });

    test("Multiple rules apply", function () {
        QUnit.expect(2);
        wa11y.register({
            name: "syncRule",
            description: "Test synchronous rule",
            rule: syncRule
        }).register({
            name: "syncRuleRevert",
            description: "Test synchronous rule revert",
            rule: syncRuleRevert
        });
        var testValidator = wa11y.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, passReport, "Log is correct");
                }
            })
            .run(simpleSource);
    });

    test("Multiple rules applied multiple times (state is scoped to a particular validator)", function () {
        QUnit.expect(4);
        var testValidator = wa11y.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, passReport, "Log is correct");
                }
            })
            .run(simpleSource)
            .run(simpleSource);
    });

    test("Multiple testers", function () {
        QUnit.expect(4);
        var validator1 = wa11y.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, passReport, "Log is correct");
                }
            }),
            validator2 = wa11y.init()
            .configure({
                 syncRule: {},
                 syncRuleRevert: {}
            })
            .onComplete(function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, failReport, "Log is correct");
                }
            });
        validator1.run(simpleSource);
        validator2.run(emptySource);
    });
    
})(QUnit);