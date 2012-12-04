/* global wa11y */
(function (wa11y, expect) {

    describe("wa11y", function() {
        var simpleSource = '<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>',
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
                }, 100);
            },
            syncRuleOptions = function (src) {
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
            // TODO: expect(5)
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
            // TODO: expect(2)
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
                // TODO: expect(1)
                var test = wa11y.test(syncRule);
                test.on("complete", function (report) {
                    expect(report).to.deep.equal(passReport);
                });
                test.run("I am a correct source");
            });

            it("fail", function () {
                // TODO: expect(1)
                var test = wa11y.test(failRule);
                test.on("complete", function (report) {
                    expect("This should never be called").to.be.ok;
                });
                test.on("fail", function (report) {
                    expect(report.FATAL.indexOf("Error during rule evaluation: "))
                        .to.equal(0);
                });
                test.run("I will fail anyways");
            });

            it("complete fail", function () {
                // TODO: expect(1)
                var test = wa11y.test(syncRule);
                test.on("complete", function (report) {
                    expect(report).to.deep.equal(failReport);
                });
                test.run("");
            });

            it("supports", function () {
                // TODO: expect(4)
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
                // TODO: expect(1)
                var test = wa11y.test(asyncRule);
                test.on("complete", function (report) {
                    expect(report).to.deep.equal(passReport);
                    done();
                });
                test.run("I am a correct source");
            });

            it("wa11y.test with async rule - fail", function (done) {
                // TODO: expect(1)
                var test = wa11y.test(asyncRule);
                test.on("complete", function (report) {
                    expect(report).to.deep.equal(failReport);
                    done();
                });
                test.run("");
            });

            it("wa11y.test with options", function () {
                // TODO: expect(2)
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

        it("Simple Rule Apply", function (done) {
            // TODO: expect(1)
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
            // TODO: expect(1)
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
            // TODO: expect(1)
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
            // TODO: expect(2)
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
                // TODO: expect(3)
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
                            FATAL: "Tester is in progress. Cancelling..."
                        });
                    })
                    .run(simpleSource)
                    .run(simpleSource);
            }
        );

        it("Multiple testers", function (done) {
            // TODO expect(3)
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
                        FATAL: "No source supplied."
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
                    expected = [true, false, false, false, true]
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

            before(function (done) {
                engine = wa11y.engine.html();
                done();
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
        });
    });
})(
    typeof wa11y === "undefined" ? require("../wa11y.js") : wa11y,
    typeof expect === "undefined" ? require("chai").expect : expect
);