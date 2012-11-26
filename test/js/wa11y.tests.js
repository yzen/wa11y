/* global QUnit, ok, test, wa11y */
(function (QUnit) {

    "use strict;"

    QUnit.module("wa11y");

    var _ = wa11y.operators,
        simpleSource = '<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>',
        emptySource = "",
        passReport = {
            INFO: "Source is not empty"
        },
        expectedPassReport = {
            INFO: ["Source is not empty"]
        },
        failReport = {
            ERROR: "Source is empty"
        },
        expectedFailReport = {
            ERROR: ["Source is empty"]
        },
        syncRule = function (src) {
            if (src.length > 0) {
                this.complete(passReport)
            } else {
                this.complete(failReport);
            }
        },
        failRule = function (src) {
            src.__error__();
        },
        asyncRule = function (src) {
            var test = this;
            setTimeout(function () {
                syncRule.apply(test, [src]);
            }, 100);
        },
        syncRuleOptions = function (src) {
            if (this.options && this.options.someOption) {
                this.complete(passReport)
            } else {
                this.complete(failReport);
            }
        },
        syncRuleRevert = function (src) {
            if (src.length < 1) {
                this.complete(failReport)
            } else {
                this.complete(passReport);
            }
        };

    wa11y.register({
        name: "syncRule",
        description: "Test synchronous rule",
        rule: syncRule
    }).register({
        name: "asyncRule",
        description: "Test asynchronous rule",
        rule: asyncRule
    }).register({
        name: "syncRuleOptions",
        description: "Test synchronous rule with options",
        rule: syncRuleOptions
    }).register({
        name: "syncRuleRevert",
        description: "Test synchronous rule revert",
        rule: syncRuleRevert
    });

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
        _.each(testMaterial.targets, function (target, index) {
            deepEqual(_.merge.apply(null,
                [target].concat(testMaterial.sources[index])),
                testMaterial.expected[index],
                "Merging result is correct");
        });
    });

    test("wa11y.indexOf", function () {
        var testMaterial = {
            values: [2, "test", "1", "test", "test2"],
            sources: [
                ["1", 0, "test"],
                ["1", 0, "test"],
                ["1", 0, "test"],
                "test",
                {test: "test"}
            ],
            expected: [-1, 2, 0, -1, -1]
        };
        _.each(testMaterial.expected, function (expected, index) {
            equal(_.indexOf(testMaterial.values[index],
                testMaterial.sources[index]),
                expected, "indexOf result is correct");
        });
    });

    test("wa11y.isHTML", function () {
        var testMaterial = {
            values: ["<a></a>", "hello <test><test/>", "no html at all",
                "a {some stuff: hello}", "<p/>testing"],
            expected: [true, true, false, false, true]
        };
        _.each(testMaterial.expected, function (expected, index) {
            equal(wa11y.isHTML(testMaterial.values[index]),
                expected, "isHTML result is correct");
        });
    });

    test("wa11y.isCSS", function () {
        var testMaterial = {
            values: ["a {}", "you you {test: hello}", "hello",
                "a {some stuff: hello}\nb {some other: works}",
                "a {} <p/>testing", "<a></a>", "<a>hello</a>"],
            expected: [true, true, false, true, true, false, false]
        };
        _.each(testMaterial.expected, function (expected, index) {
            equal(wa11y.isCSS(testMaterial.values[index]),
                expected, "isCSS result is correct");
        });
    });

    test("wa11y.getSrcType", function () {
        var testMaterial = {
            values: ["<a></a>", "hello <test><test/>", "no html at all",
                "a {some stuff: hello}", "<p/>testing", "a {}",
                "you you {test: hello}", "hello",
                "a {some stuff: hello}\nb {some other: works}",
                "a {} <p/>testing", "<a></a>", "<a>hello</a>"],
            expected: ["html", "html", undefined, "css", "html", "css", "css",
                undefined, "css", "html", "html", "html"]
        };
        _.each(testMaterial.expected, function (expected, index) {
            equal(wa11y.getSrcType(testMaterial.values[index]),
                expected, "getSrcType result is correct");
        });
    });

    test("wa11y.find", function () {
        var criteria = function (val, keyOrIndex) {
            if (val === "find") {return keyOrIndex;}
        }, sources = [{
            a: "1",
            b: "find"
        }, {
            a: "1",
            c: "11"
        }, ["1", "find", "123"],
            ["1", "123", "hohoho"]
        ], expected = ["b", undefined, 1, undefined];
        _.each(sources, function (source, index) {
            equal(_.find(source, criteria), expected[index],
                "Find result is correct");
        });
    });

    test("wa11y.remove", function () {
        var criteria = function (val, keyOrIndex) {
            if (val === "find") {return keyOrIndex;}
        }, sources = [{
            a: "1",
            b: "find"
        }, {
            a: "1",
            c: "11"
        }, ["1", "find", "123"],
            ["1", "123", "hohoho"]
        ], expected = [{
            a: "1"
        }, {
            a: "1",
            c: "11"
        }, ["1", "123"],
            ["1", "123", "hohoho"]
        ];
        _.each(sources, function (source, index) {
            deepEqual(_.remove(source, criteria), expected[index],
                "Element should be removed if it was present");
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

    test("wa11y.logger", function () {
        expect(3);
        var logger = wa11y.logger();
        logger.onLog(function (report) {
            deepEqual(report, {INFO: "test"}, "Correct log report");
        });
        logger.log({INFO: "test"});

        logger = wa11y.logger();
        logger.onLog(function (report) {
            deepEqual(report, {ERROR: "test"}, "Correct log report");
        });
        logger.log({ERROR: "test"});

        logger = wa11y.logger({
            severity: "ERROR"
        });
        logger.onLog(function (report) {
            // This should not fire
            deepEqual(report, {WARNING: "test"}, "Correct log report");
        });
        logger.log({WARNING: "test"});

        logger = wa11y.logger({
            severity: "ERROR"
        });
        logger.onLog(function (report) {
            deepEqual(report, {FATAL: "test FATAL"}, "Correct log report");
        });
        logger.log({FATAL: "test FATAL"});
    });

    test("wa11y.test complete pass", function () {
        QUnit.expect(1);
        var test = wa11y.test(syncRule);
        test.onComplete(function (report) {
            deepEqual(report, passReport, "Correct pass report");
        });
        test.run("I am a correct source");
    });

    test("wa11y.test FATAL", function () {
        QUnit.expect(1);
        var test = wa11y.test(failRule);
        test.onComplete(function (report) {
            ok("This should never be called");
        });
        test.onFail(function (report) {
            equal(report.FATAL.indexOf("Error during rule evaluation: "), 0,
                "Correct FATAL report");
        });
        test.run("I will fail anyways");
    });

    test("wa11y.test complete fail", function () {
        QUnit.expect(1);
        var test = wa11y.test(syncRule);
        test.onComplete(function (report) {
            deepEqual(report, failReport, "Correct fail report");
        });
        test.run("");
    });

    test("wa11y.test supports", function () {
        QUnit.expect(4);
        var test = wa11y.test(syncRule);
        equal(test.supports("css"), true, "CSS source type should" +
            "be supproted.");
        equal(test.supports("html"), true, "HTML source type should" +
            "be supproted.");
        var test2 = wa11y.test(syncRule, {
            srcTypes: "html"
        });
        equal(test2.supports("css"), false, "CSS source type should" +
            "not be supproted.");
        equal(test2.supports("html"), true, "HTML source type should" +
            "be supproted.");
    });

    asyncTest("wa11y.test with async rule - pass", function () {
        QUnit.expect(1);
        var test = wa11y.test(asyncRule);
        test.onComplete(function (report) {
            deepEqual(report, passReport, "Correct pass report");
            start();
        });
        test.run("I am a correct source");
    });

    asyncTest("wa11y.test with async rule - fail", function () {
        QUnit.expect(1);
        var test = wa11y.test(asyncRule);
        test.onComplete(function (report) {
            deepEqual(report, failReport, "Correct fail report");
            start();
        });
        test.run("");
    });

    test("wa11y.test with options", function () {
        QUnit.expect(2);
        var test = wa11y.test(syncRuleOptions, {
            someOption: "rule option"
        });
        test.onComplete(function (report) {
            deepEqual(report, passReport, "Correct pass report");
        });
        test.run("I am a correct source");
        test.run("");
    });

    asyncTest("Simple Rule Apply", function () {
        QUnit.expect(1);
        var testValidator = wa11y.init();
        testValidator.configure({
            rules: {
                syncRule: {}
            }
        });
        testValidator.on("complete", function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, expectedPassReport, "Log is correct");
            }
            start();
        });
        testValidator.run(simpleSource);
    });

    asyncTest("Simple Async Rule Apply", function () {
        QUnit.expect(1);
        var testValidator = wa11y.init();
        testValidator.configure({
            rules: {
                asyncRule: {}
            }
        });
        testValidator.on("complete", function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, expectedPassReport, "Log is correct");
            }
            start();
        });
        testValidator.run(simpleSource);
    });

    asyncTest("Simple Sync Rule with Options Apply", function () {
        QUnit.expect(1);
        var testValidator = wa11y.init();
        testValidator.configure({
            rules: {
                syncRuleOptions: {
                    someOption: "some option"
                }
            }
        });
        testValidator.on("complete", function (log) {
            var key, thisLog;
            for (key in log) {
                thisLog = log[key];
                deepEqual(thisLog, expectedPassReport, "Log is correct");
            }
            start();
        });
        testValidator.run(simpleSource);
    });

    asyncTest("Multiple rules apply", function () {
        QUnit.expect(2);
        var testValidator = wa11y.init()
            .configure({
                rules: {
                    syncRule: {},
                    syncRuleRevert: {}
                }
            })
            .on("complete", function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, expectedPassReport, "Log is correct");
                }
                start();
            })
            .run(simpleSource);
    });

    asyncTest("Multiple rules applied only once since the initial run is in progress",
        function () {
            QUnit.expect(3);
            var testValidator = wa11y.init()
                .configure({
                    rules: {
                        syncRule: {},
                        asyncRule: {}
                    }
                })
                .on("complete", function (log) {
                    var key, thisLog;
                    for (key in log) {
                        thisLog = log[key];
                        deepEqual(thisLog, expectedPassReport, "Log is correct");
                    }
                    start();
                })
                .on("cancel", function (report) {
                    equal(report, "Tester is in progress. Cancelling...",
                        "Cancel event report is correct");
                })
                .run(simpleSource)
                .run(simpleSource);
        }
    );

    asyncTest("Multiple testers", function () {
        QUnit.expect(3);
        var i = 0,
            validator1 = wa11y.init()
            .configure({
                rules: {
                    syncRule: {},
                    syncRuleRevert: {}
                }
            })
            .on("complete", function (log) {
                var key, thisLog;
                for (key in log) {
                    thisLog = log[key];
                    deepEqual(thisLog, expectedPassReport, "Log is correct");
                }
                ++i;
                if (i > 1) {
                    start();
                }
            }),
            validator2 = wa11y.init()
            .configure({
                rules: {
                    syncRule: {},
                    syncRuleRevert: {}
                }
            })
            .on("fail", function (log) {
                equal(log, "No source supplied.", "Log is correct");
                ++i;
                if (i > 1) {
                    start();
                }
            });
        validator1.run(simpleSource);
        validator2.run(emptySource);
    });
    
})(QUnit);