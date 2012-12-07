/*global module, describe:true, it:true, expect:true, before:true*/
(function (module) {

    "use strict";

    module.exports = function (wa11y, expect) {
        describe("wa11y", function() {
            var simpleSource = '<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>',
                emptySource = "",
                passReport = {
                    message: "Source is not empty",
                    severity: "INFO"
                },
                expectedPassReport = {
                    INFO: ["Source is not empty"]
                },
                failReport = {
                    message: "Source is empty",
                    severity: "ERROR"
                },
                expectedFailReport = {
                    ERROR: ["Source is empty"]
                },
                syncRule = function (src) {
                    if (src.length > 0) {
                        this.complete(passReport);
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
                    }, 1);
                },
                syncRuleOptions = function () {
                    if (this.options && this.options.someOption) {
                        this.complete(passReport);
                    } else {
                        this.complete(failReport);
                    }
                },
                syncRuleRevert = function (src) {
                    if (src.length < 1) {
                        this.complete(failReport);
                    } else {
                        this.complete(passReport);
                    }
                },
                ruleWithEngine = function (src) {
                    var engine = this.engine,
                        link = engine.find(".the-link");
                    
                    if (link.length < 1) {
                        this.complete(failReport);
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
            }).register({
                name: "ruleWithEngine",
                description: "Test rule with engine inside",
                rule: ruleWithEngine
            });

            // This is a way to track how many tests ran;
            var tracker = {},
                runs = function (test, total) {
                    var getTitle = function (test) {
                        if (!test.title) {return "";}
                        return getTitle(test.parent) + "@" + test.title;
                    };
                    tracker.total = total;
                    tracker.title = getTitle(test);
                },
                chaiExpect = expect;
            expect = function () {
                if (tracker.total > 0) {
                    ++tracker.count;
                }
                return chaiExpect.apply(undefined,
                    Array.prototype.slice.apply(arguments));
            };
            beforeEach(function () {
                tracker = {
                    count: 0,
                    total: 0
                };
            });
            afterEach(function () {
                if (tracker.total !== tracker.count) {
                    // Using throw instead of this.test.error()
                    // because it seems like mocha doesn't spot nested fail
                    // in afterEach
                    throw new Error(tracker.title + ": expected " +
                        tracker.total + " but only saw " + tracker.count);
                }
            });
            
            it("wa11y.isHTML", function() {
                var testMaterial = {
                    values: ["<a></a>", "hello <test><test/>", "no html at all",
                        "a {some stuff: hello}", "<p/>testing"],
                    expected: [true, true, false, false, true]
                };
                wa11y.each(testMaterial.expected, function (expected, index) {
                    expect(wa11y.isHTML(testMaterial.values[index])).to.equal(expected);
                });
            });
    
            it("wa11y.isCSS", function() {
                var testMaterial = {
                    values: ["a {}", "you you {test: hello}", "hello",
                        "a {some stuff: hello}\nb {some other: works}",
                        "a {} <p/>testing", "<a></a>", "<a>hello</a>"],
                    expected: [true, true, false, true, true, false, false]
                };
                wa11y.each(testMaterial.expected, function (expected, index) {
                    expect(wa11y.isCSS(testMaterial.values[index])).to.equal(expected);
                });
            });
    
            it("wa11y.getSrcType", function() {
                var testMaterial = {
                    values: ["<a></a>", "hello <test><test/>", "no html at all",
                        "a {some stuff: hello}", "<p/>testing", "a {}",
                        "you you {test: hello}", "hello",
                        "a {some stuff: hello}\nb {some other: works}",
                        "a {} <p/>testing", "<a></a>", "<a>hello</a>"],
                    expected: ["html", "html", undefined, "css", "html", "css", "css",
                        undefined, "css", "html", "html", "html"]
                };
                wa11y.each(testMaterial.expected, function (expected, index) {
                    expect(wa11y.getSrcType(testMaterial.values[index])).to.equal(expected);
                });
            });
    
            it("wa11y.emitter", function () {
                runs(this.test, 5);
                var args = ["test1", "test2"];
                var emitter = wa11y.emitter();
                emitter.on("test1", function () {
                    expect("Listener is properly fired").to.be.ok;
                });
                emitter.emit("test1");
                emitter.on("test1", function () {
                    expect("Both listeners fire").to.be.ok;
                });
                emitter.emit("test1");
                emitter.on("test2", function () {
                    var i;
                    for (i = 0; i < arguments.length; ++i) {
                        expect(arguments[i]).to.equal(args[i]);
                    }
                });
                emitter.emit.apply(null, ["test1"].concat(args));
            });
    
            it("wa11y.logger", function () {
                runs(this.test, 2);
                var logger = wa11y.logger();
                logger.on("log", function (report) {
                    expect(report).to.deep.equal({INFO: "test"});
                });
                logger.log({INFO: "test"});
        
                logger = wa11y.logger();
                logger.on("log", function (report) {
                    expect(report).to.deep.equal({ERROR: "test"});
                });
                logger.log({ERROR: "test"});
            });
    
            describe("wa11y.test", function () {
                it("complete pass", function () {
                    runs(this.test, 1);
                    var test = wa11y.test(syncRule);
                    test.on("complete", function (report) {
                        expect(report).to.deep.equal(passReport);
                    });
                    test.run("I am a correct source");
                });
    
                it("fail", function () {
                    runs(this.test, 1);
                    var test = wa11y.test(failRule);
                    test.on("complete", function () {
                        expect("This should never be called").to.be.ok;
                    });
                    test.on("fail", function (report) {
                        expect(report.message.indexOf("Error during rule evaluation: "))
                            .to.equal(0);
                    });
                    test.run("I will fail anyways");
                });
    
                it("complete fail", function () {
                    runs(this.test, 1);
                    var test = wa11y.test(syncRule);
                    test.on("complete", function (report) {
                        expect(report).to.deep.equal(failReport);
                    });
                    test.run("");
                });
    
                it("supports", function () {
                    runs(this.test, 4);
                    var test = wa11y.test(syncRule);
                    expect(test.supports("css")).to.be.true;
                    expect(test.supports("html")).to.be.true;
                    var test2 = wa11y.test(syncRule, {
                        srcTypes: "html"
                    });
                    expect(test2.supports("css")).to.be.false;
                    expect(test2.supports("html")).to.be.true;
                });
    
                it("wa11y.test with async rule - pass", function (done) {
                    runs(this.test, 1);
                    var test = wa11y.test(asyncRule);
                    test.on("complete", function (report) {
                        expect(report).to.deep.equal(passReport);
                        done();
                    });
                    test.run("I am a correct source");
                });
    
                it("wa11y.test with async rule - fail", function (done) {
                    runs(this.test, 1);
                    var test = wa11y.test(asyncRule);
                    test.on("complete", function (report) {
                        expect(report).to.deep.equal(failReport);
                        done();
                    });
                    test.run("");
                });
    
                it("wa11y.test with options", function () {
                    runs(this.test, 2);
                    var test = wa11y.test(syncRuleOptions, {
                        someOption: "rule option"
                    });
                    test.on("complete", function (report) {
                        expect(report).to.deep.equal(passReport);
                    });
                    test.run("I am a correct source");
                    test.run("");
                });
            });

            describe("wa11y.progress", function () {
                it("start - complete in order", function () {
                    var progress = wa11y.progress();
                    progress.on("complete", function () {
                        expect("Progress completed").to.be.ok;
                    });
                    progress.start({"one": "one", "two": "two",
                        "three": "three"});
                    progress.emit("one");
                    progress.emit("two");
                    progress.emit("three");
                });
                it("start - complete out of order", function () {
                    var progress = wa11y.progress();
                    progress.on("complete", function () {
                        expect("Progress completed").to.be.ok;
                    });
                    progress.start([0, 1, 2]);
                    progress.emit(0);
                    progress.emit(2);
                    progress.emit(1);
                });
                it("start - complete async", function (done) {
                    var progress = wa11y.progress();
                    progress.on("complete", function () {
                        expect("Progress completed").to.be.ok;
                        done();
                    });
                    progress.start({"one": "one", "two": "two",
                        "three": "three"});
                    setTimeout(function () {
                        progress.emit("one");
                    }, 1);
                    setTimeout(function () {
                        progress.emit("three");
                    }, 1);
                    progress.emit("two");
                });
                it("isBusy", function () {
                    var progress = wa11y.progress();
                    progress.on("complete", function () {
                        expect(progress.isBusy()).to.be.false;
                    });
                    expect(progress.isBusy()).to.be.false;
                    progress.start([0, 1, 2]);
                    progress.emit(0);
                    expect(progress.isBusy()).to.be.true;
                    progress.emit(2);
                    progress.emit(1);
                });
                it("isBusy async", function (done) {
                    var progress = wa11y.progress();
                    expect(progress.isBusy()).to.be.false;
                    progress.on("complete", function () {
                        done();
                    });
                    progress.start([0, 1, 2]);
                    progress.emit(0);
                    progress.emit(2);
                    setTimeout(function () {
                        progress.emit(1);
                    }, 1);
                    expect(progress.isBusy()).to.be.true;
                });
            });

            describe("wa11y.output", function () {
                it("ignore", function () {
                    var output = wa11y.output(),
                        args = [
                            [undefined, undefined, undefined, undefined],
                            ["INFO", "INFO", undefined, undefined],
                            [undefined, undefined, "A", "A"],
                            ["INFO", "INFO", "A", "A"],
                            ["ERROR", "INFO", "A", "A"],
                            ["ERROR", "INFO", "AA", "A"],
                            ["INFO", "ERROR", "AA", "A"],
                            ["INFO", "INFO", "A", "AA"],
                            ["INFO", "INFO", undefined, "A"],
                            ["INFO", "INFO", "A", undefined],
                            [undefined, "INFO", "A", "A"],
                            ["INFO", undefined, "A", "A"],
                            ["INFO", "ERROR", "A", "AA"],
                            ["INFO", "INFO", undefined, "AA"],
                            [undefined, "ERROR", "AA", "AA"]
                        ],
                        expected = [false, false, false, false, false, false,
                            true, true, false, false, false, false, true,
                            false, false];
                    wa11y.each(args, function (arggs, i) {
                        expect(output.ignore.apply(undefined,
                            arggs)).to.be.equal(expected[i]);
                    });
                });
                var logs = [[{
                        message: "This is a log message",
                        severity: "INFO"
                    }, {
                        name: "some_rule",
                        description: undefined,
                        severity: "INFO",
                        level: undefined
                    }, {srcType: "html"}], [{
                        message: "This is a log message",
                        severity: "ERROR"
                    }, {
                        name: "some_rule",
                        description: undefined,
                        severity: "INFO",
                        level: undefined
                    }, {srcType: "html"}], [{
                        message: "This is a log message",
                        severity: "WARNING"
                    }, {
                        name: "some_other_rule",
                        description: undefined,
                        severity: "INFO",
                        level: "A"
                    }, {srcType: "html"}], [{
                        message: "This is a log message",
                        severity: "WARNING",
                        level: "AAA"
                    }, {
                        name: "some_other_rule",
                        description: undefined,
                        severity: "INFO",
                        level: "AA"
                    }, {srcType: "css"}], [{
                        message: "This is a log message"
                    }, {
                        name: "rrule",
                        description: undefined,
                        severity: "INFO",
                        level: "AA"
                    }, {srcType: "css"}], [{
                        message: "This is a log message",
                        severity: "INFO"
                    }, {
                        name: "some_rule",
                        description: undefined,
                        severity: "INFO",
                        level: undefined
                    }, {srcType: "html"}], [{
                        message: "This is a log message"
                    }, {
                        name: "last_rule",
                        description: undefined,
                        severity: undefined,
                        level: undefined
                    }, {srcType: "html"}]];
                it("print default", function () {
                    var output = wa11y.output({
                        format: "test.source.level.severity.json"
                    });
                    wa11y.each(logs, function (logArgs) {
                        output.logger.log.apply(undefined, logArgs);
                    });
                    expect(output.print()).to.deep.equal({
                        some_rule: {
                            html: {INFO: ["This is a log message",
                                "This is a log message"],
                                ERROR: ["This is a log message"]}
                        },
                        some_other_rule: {
                            html: {A: {WARNING: ["This is a log message"]}},
                            css: {AAA: {WARNING: ["This is a log message"]}}
                        },
                        rrule: {css: {AA: {INFO: ["This is a log message"]}}},
                        last_rule: {html: ["This is a log message"]}
                    });
                    output = wa11y.output({
                        format: "test.source.severity.level.json"
                    });
                    wa11y.each(logs, function (logArgs) {
                        output.logger.log.apply(undefined, logArgs);
                    });
                    expect(output.print()).to.deep.equal({
                        some_rule: {
                            html: {INFO: ["This is a log message",
                                "This is a log message"],
                                ERROR: ["This is a log message"]}
                        },
                        some_other_rule: {
                            html: {WARNING: {A: ["This is a log message"]}},
                            css: {WARNING: {AAA: ["This is a log message"]}}
                        },
                        rrule: {css: {INFO: {AA: ["This is a log message"]}}},
                        last_rule: {html: ["This is a log message"]}
                    });
                    output = wa11y.output({
                        format: "test.severity.json"
                    });
                    wa11y.each(logs, function (logArgs) {
                        output.logger.log.apply(undefined, logArgs);
                    });
                    expect(output.print()).to.deep.equal({
                        some_rule: {
                            INFO: ["This is a log message",
                                "This is a log message"],
                            ERROR: ["This is a log message"]
                        },
                        some_other_rule: {
                            WARNING: ["This is a log message",
                                "This is a log message"]
                        },
                        rrule: {INFO: ["This is a log message"]},
                        last_rule: ["This is a log message"]
                    });
                });
            });
    
            it("Simple Rule Apply", function (done) {
                runs(this.test, 1);
                var testValidator = wa11y.init();
                testValidator.configure({
                    rules: {
                        syncRule: {}
                    }
                });
                testValidator.on("complete", function (log) {
                    var key, docId, thisLog;
                    for (key in log) {
                        for (docId in log[key]) {
                            thisLog = log[key][docId];
                            expect(thisLog).to.deep.equal(expectedPassReport);
                        }
                    }
                    done();
                });
                testValidator.run(simpleSource);
            });
    
            it("Simple Async Rule Apply", function (done) {
                runs(this.test, 1);
                var testValidator = wa11y.init();
                testValidator.configure({
                    rules: {
                        asyncRule: {}
                    }
                });
                testValidator.on("complete", function (log) {
                    var key, docId, thisLog;
                    for (key in log) {
                        for (docId in log[key]) {
                            thisLog = log[key][docId];
                            expect(thisLog).to.deep.equal(expectedPassReport);
                        }
                    }
                    done();
                });
                testValidator.run(simpleSource);
            });
    
            it("Simple Sync Rule with Options Apply", function (done) {
                runs(this.test, 1);
                var testValidator = wa11y.init();
                testValidator.configure({
                    rules: {
                        syncRuleOptions: {
                            someOption: "some option"
                        }
                    }
                });
                testValidator.on("complete", function (log) {
                    var key, docId, thisLog;
                    for (key in log) {
                        for (docId in log[key]) {
                            thisLog = log[key][docId];
                            expect(thisLog).to.deep.equal(expectedPassReport);
                        }
                    }
                    done();
                });
                testValidator.run(simpleSource);
            });
        
            it("Multiple rules apply", function (done) {
                runs(this.test, 2);
                var testValidator = wa11y.init()
                    .configure({
                        rules: {
                            syncRule: {},
                            syncRuleRevert: {}
                        }
                    })
                    .on("complete", function (log) {
                        var key, docId, thisLog;
                        for (key in log) {
                            for (docId in log[key]) {
                                thisLog = log[key][docId];
                                expect(thisLog).to.deep.equal(expectedPassReport);
                            }
                        }
                        done();
                    })
                    .run(simpleSource);
            });
    
            it("Multiple rules applied only once since the initial run is in progress",
                function (done) {
                    runs(this.test, 3);
                    var testValidator = wa11y.init()
                        .configure({
                            rules: {
                                syncRule: {},
                                asyncRule: {}
                            }
                        })
                        .on("complete", function (log) {
                            var key, docId, thisLog;
                            for (key in log) {
                                for (docId in log[key]) {
                                    thisLog = log[key][docId];
                                    expect(thisLog).to.deep.equal(expectedPassReport);
                                }
                            }
                            done();
                        })
                        .on("fail", function (report) {
                            expect(report).to.deep.equal({
                                message: "Tester is in progress. Cancelling...",
                                severity: "FATAL"
                            });
                        })
                        .run(simpleSource)
                        .run(simpleSource);
                }
            );
    
            it("Multiple testers", function (done) {
                runs(this.test, 3);
                var i = 0,
                    validator1 = wa11y.init()
                    .configure({
                        rules: {
                            syncRule: {},
                            syncRuleRevert: {}
                        }
                    })
                    .on("complete", function (log) {
                        var key, docId, thisLog;
                        for (key in log) {
                            for (docId in log[key]) {
                                thisLog = log[key][docId];
                                expect(thisLog).to.deep.equal(expectedPassReport);
                            }
                        }
                        ++i;
                        if (i > 1) {
                            done();
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
                        expect(log).to.deep.equal({
                            message: "No source supplied.",
                            severity: "FATAL"
                        });
                        ++i;
                        if (i > 1) {
                            done();
                        }
                    });
                validator1.run(simpleSource);
                validator2.run(emptySource);
            });
    
            describe("operations", function () {
                it("wa11y.isArray", function() {
                    var values = [[], undefined, true, {length: 2, 0: 2}, [1, {}]],
                        expected = [true, false, false, false, true];
                    wa11y.each(values, function (value, index) {
                        expect(wa11y.isArray(value)).to.equal(expected[index]);
                    });
                });
    
                it("wa11y.merge", function() {
                    var testMaterial = {
                        targets: [{}, {simple: "old"}, {simple: "old"}, {
                            simple: "old", other: "other"}, ["test", {
                            simple: "old"}], {test: {a: "b"}}],
    
                        sources: [[{simple: "simple"}], [{simple: "new"}], [{
                            simple: "new"}, {simple: "newer"}], [{other: "new"}],
                            [["wow", {other: "new"}]], [undefined, {test: {a: "c"}}]],
    
                        expected: [{simple: "simple"}, {simple: "new"}, {
                            simple: "newer"
                        }, {simple: "old", other: "new"}, ["wow", {
                            other: "new",
                            simple: "old"
                        }], {test: {a: "c"}}]
                    };
                    wa11y.each(testMaterial.targets, function (target, index) {
                        var b = wa11y.merge.apply(null, [target].concat(testMaterial.sources[index]));
                        expect(b)
                            .to.deep.equal(testMaterial.expected[index]);
                    });
                });
    
                it("wa11y.indexOf", function() {
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
                    wa11y.each(testMaterial.expected, function (expected, index) {
                        expect(wa11y.indexOf(testMaterial.values[index],
                            testMaterial.sources[index])).to.equal(expected);
                    });
                });
    
                it("wa11y.find", function() {
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
                    wa11y.each(sources, function (source, index) {
                        expect(wa11y.find(source, criteria), expected[index]).to.equal(expected[index]);
                    });
                });
            });
    
            describe("wally.engine.html", function () {
                var engine;
    
                before(function () {
                    engine = wa11y.engine.html();
                });
    
                it("listener check", function (done) {
                    engine.process("", function () {
                        expect(true).to.be.true;
                        done();
                    });
                });
    
                it("parsing non-valid HTML", function (done) {
                    engine.process("I'm not a valid HTML", function (err, wrapper) {
                        if (wa11y.isNode) {
                            expect(err).to.be.ok;
                        } else {
                            var buttons = wrapper.find("button");
                            expect(buttons.length).to.equal(0);
                        }
                        done();
                    });
                });
    
                it("parsing valid HTML", function (done) {
                    engine.process("<div class='my'>This div is ARIA friendly</div>", function (err, wrapper) {
                        var buttons = wrapper.find(".my");
                        expect(buttons.length).to.equal(1);
                        done();
                    });
                });
    
                it("more DOM functionality", function (done) {
                    engine.process("<div class='my'><span class='mytext'>Found</span><span class='mytext'>Me</span></div>", function (err, wrapper) {
                        var spans = wrapper.find(".mytext");
                        expect(spans.length).to.equal(2);
                        expect(spans[0].innerHTML + " " + spans[1].innerHTML).to.equal("Found Me");
                        expect(spans[0].parentNode.className).to.equal("my");
                        done();
                    });
                });
                
                it("engine functions inside the rule", function (done) {
                    runs(this.test, 1);
                    var testValidator = wa11y.init();
                    testValidator.configure({
                        rules: {
                            ruleWithEngine: {}
                        }
                    });
                    testValidator.on("complete", function (log) {
                        var key, docId, thisLog;
                        for (key in log) {
                            for (docId in log[key]) {
                                thisLog = log[key][docId];
                                expect(thisLog).to.deep.equal(expectedPassReport);
                            }
                        }
                        done();
                    });
                    testValidator.run(simpleSource);
                });
                
            });
        });
    };

})(module);