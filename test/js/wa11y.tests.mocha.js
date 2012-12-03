/* global wa11y */
(function (wa11y, expect) {

    describe("wa11y", function() {
        it("wa11y.isArray", function() {
            var values = [[], undefined, true, {length: 2, 0: 2}, [1, {}]],
                expected = [true, false, false, false, true]
            wa11y.each(values, function (value, index) {
                expect(wa11y.isArray(value)).to.equal(expected[index]);
            });
        });
    });

})(
    typeof wa11y === "undefined" ? require("../../wa11y.js") : wa11y,
    typeof expect === "undefined" ? require("chai").expect : expect
);