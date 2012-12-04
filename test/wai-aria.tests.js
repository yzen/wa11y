/* global wa11y */
(function (wa11y, expect) {

    describe("wai-aria", function () {
        it("Rule apply", function (done) {
            // TODO: expect(1)
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
                        expect(thisLog).to.deep.equal({
                            INFO: ["wai-aria test passed."]
                        });
                    }
                }
            });
            testValidator.run('<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>');
            done();
        })
    });

})(
    typeof wa11y === "undefined" ? require("../wa11y.js") : wa11y,
    typeof expect === "undefined" ? require("chai").expect : expect
);