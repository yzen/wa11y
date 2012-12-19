(function (define) {

  "use strict";

  define(function (wa11y) {
    var rule = function (src) {
      var that = this,
        engine = this.engine,
        images = engine.find("img"),

        checkAltAttribute = function (image) {
          var attributes = image.attributes,
            outerHTML = image.outerHTML,
            i, logMessage, length = attributes.length;

          logMessage = { 
            severity: "ERROR",
            message: "Image " + outerHTML + ": should have an ALT attribute"
          };

          for (i=0; i< length; ++i) {
            if (attributes[i].name === "alt") {
              if (attributes[i].nodeValue !== "") {
                return;
              } else {
                logMessage = {
                  severity: "ERROR",
                  message: "Image " + outerHTML + ": should have a non empty ALT attribute"
                };
                break;
              }
            }
          }
          that.log(logMessage);
        },

        process = function (image) {
          checkAltAttribute(image);
        };

      if (images.length === 0) {
        that.complete({
          severity: "INFO",
          message: "No images found in the source."
        });
        return;
      }

      var i, length = images.length;

      for (i = 0; i< length; ++i) {
        process(images[i]);
      }
    };

    wa11y.register({
      name: "wai-img",
      description: "Basic accessability image tests according to WCAG version 2.0",
      rule: rule,
      options: {}
    });
  });

})(function (factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory;
  } else {
    factory(wa11y);
  }
});