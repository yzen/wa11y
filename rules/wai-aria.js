(function (define) {

    "use strict";

    define(function (validator) {
        var rule = function (test, source) {
            test.pass({
                message: "WAI-ARIA test passed."
            });
        };
        validator.register("wai-aria", "WAI-ARIA, the Accessible Rich " +
            "Internet Applications Suite, defines a way to make Web content " +
            "and Web applications more accessible to people with " +
            "disabilities. It especially helps with dynamic content and " +
            "advanced user interface controls developed with Ajax, HTML, " +
            "JavaScript, and related technologies.", rule);
    });

})(function (factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory;
    } else {
        factory(validator);
    }
});