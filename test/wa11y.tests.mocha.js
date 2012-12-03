/* global wa11y */
(function (wa11y, expect) {

    describe("wa11y", function() {
        describe("operations", function () {
            it("wa11y.isArray", function() {
                var values = [[], undefined, true, {length: 2, 0: 2}, [1, {}]],
                    expected = [true, false, false, false, true]
                wa11y.each(values, function (value, index) {
                    expect(wa11y.isArray(value)).to.equal(expected[index]);
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
                        expect(0).to.equal(buttons.length);
                    }
                    done();
                });
            });
            
            it("parsing valid HTML", function (done) {
                engine.process("<div class='my'>This div is ARIA friendly</div>", function (err, wrapper) {
                    var buttons = wrapper.find(".my");
                    expect(1).to.equal(buttons.length);
                    done();
                });
            });
            
            it("more DOM functionality", function (done) {
                engine.process("<div class='my'><span class='mytext'>Found</span><span class='mytext'>Me</span></div>", function (err, wrapper) {
                    var spans = wrapper.find(".mytext");
                    expect(2).to.equal(spans.length);
                    expect("Found Me").to.equal(spans[0].innerHTML + " " + spans[1].innerHTML);
                    expect("my").to.equal(spans[0].parentNode.className);
                    done();
                });
            });
        });
    });

})(
    typeof wa11y === "undefined" ? require("../wa11y.js") : wa11y,
    typeof expect === "undefined" ? require("chai").expect : expect
);