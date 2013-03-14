(function (define) {

  "use strict";

  define(function (wa11y) {
    var rule = function (src) {
      var that = this,
        engine = this.engine,
        // Find all images in the document.
        images = engine.find("img");

      // If there are no images fine, complete the rule execution.
      if (images.length === 0) {
        that.complete({
          severity: "INFO",
          message: "No images found in the source."
        });
        return;
      }

      var checkAltAttribute = function (image) {
        var alt = engine.attr(image, "alt"),
          src = engine.attr(image, "src"),
          outerHTML = image.outerHTML,
          minWidth = that.options.minWidth,
          maxWidth = that.options.maxWidth;

        if (!alt) {
          return {
            severity: "ERROR",
            message: "Image " + outerHTML + ': does not have an "alt" attribute'
          };
        } else if (alt === "") {
          return {
            severity: "ERROR",
            message: "Image " + outerHTML + ': has an empty "alt" attribute'
          };
        } else if (engine.trim(alt) === "") {
          return {
            severity: "ERROR",
            message: "Image " + outerHTML + ': has an invalid "alt" attribute'
          };
        } else if (alt === src) {
          return {
            severity: "WARNING",
            message: "Image " + outerHTML + ': has an "alt" attribute same as its "src"'
          };
        } else if (minWidth && minWidth > alt.length) {
          return {
            severity: "WARNING",
            message: "Image " + outerHTML + ': has a short "alt" attribute which is less than ' + minWidth + " characters."
          };
        } else if (maxWidth && maxWidth < alt.length) {
          return {
            severity: "WARNING",
            message: "Image " + outerHTML + ': has a long "alt" attribute which is bigger than ' + maxWidth + " characters."
          }
        }
      };

      wa11y.each(images, function (image) {
        var msg = checkAltAttribute(image);
        if (msg) {
          that.log(msg);
        }
      });

      that.complete({
        severity: "INFO",
        message: "Complete."
      });
    };

    wa11y.register({
      name: "wai-img",
      description: "Basic accessability image tests according to WCAG version 2.0",
      rule: rule,
      options: {
        // minWidth - a minimum length threshold for alt attribure
        // maxWidth - a maximum length threshold for alt attribute
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