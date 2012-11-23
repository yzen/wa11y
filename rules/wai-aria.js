(function (define) {

    "use strict";

    define(function (wa11y) {
        var rule = function (src) {
            // this contains the following fields:
            // complete - method to be called when the rule test completes.
            // options - the final merged options object.
            // srcType - the type of the current source.
            // engine - wa11y parsing engine ( supplies methods like: find(selector) )
            this.complete({
                message: "wai-aria test passed."
            });
        };

        wa11y.register({
            // Name of the rule.
            name: "wai-aria",
            // Description of the WAI-ARIA rule.
            description: "WAI-ARIA, the Accessible Rich " +
                "Internet Applications Suite, defines a way to make Web content " +
                "and Web applications more accessible to people with " +
                "disabilities. It especially helps with dynamic content and " +
                "advanced user interface controls developed with Ajax, HTML, " +
                "JavaScript, and related technologies.",
            rule: rule,
            // Options are merged with default wa11y-wide test options as well
            // as options coming from the configuration..
            options: {
                // TODO: Here go the options for this rule.
            }
        });
    });

})(function (factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory;
    } else {
        factory(wa11y);
    }
});