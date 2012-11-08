(function (define) {

    "use strict";

    define(function (wa11ydator) {
        // options is merged between the default ones specified with
        // wa11ydator.register call and the options specified in config.
        var rule = function (test, source, options) {
            test.pass({
                message: "wai-aria test passed."
            });
        };
        wa11ydator.register({
            name: "wai-aria",
            description: "WAI-ARIA, the Accessible Rich " +
                "Internet Applications Suite, defines a way to make Web content " +
                "and Web applications more accessible to people with " +
                "disabilities. It especially helps with dynamic content and " +
                "advanced user interface controls developed with Ajax, HTML, " +
                "JavaScript, and related technologies.",
            rule: rule,
            options: {
                // TODO: Here go the options for this rule.
            }
        });
    });

})(function (factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory;
    } else {
        factory(wa11ydator);
    }
});