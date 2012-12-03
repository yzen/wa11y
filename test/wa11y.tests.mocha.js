/* global wa11y */
(function (wa11y, expect) {

    describe("wa11y", function() {
        
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