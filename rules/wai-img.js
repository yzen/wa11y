(function (define) {

  "use strict";

  define(function (wa11y) {
    var rule = function (src) {
      var that = this,
        engine = this.engine,
        images = engine.find("img"),
        checkAltAttribute = function (image) {
          var attributes = image.attributes,
            alt = attributes.getNamedItem("alt") ? attributes.getNamedItem("alt").nodeValue : null,
            src = attributes.getNamedItem("src") ? attributes.getNamedItem("src").nodeValue : null,
            outerHTML = image.outerHTML,
            minWidth = that.options.minWidth,
            maxWidth = that.options.maxWidth,
            logMessage;

          if (!alt) {
            logMessage = { 
              severity: 'ERROR',
              message: 'Image ' + outerHTML + ': does not have an "alt" attribute'
            };
          } else if (alt === "") {
            logMessage = {
              severity: 'ERROR',
              message: 'Image ' + outerHTML + ': has an empty "alt" attribute'
            };
          } else if (engine.trim(alt) === "") {
            logMessage = {
              severity: 'ERROR',
              message: 'Image ' + outerHTML + ': has an invalid "alt" attribute'
            };
          } else if (alt === src) {
            logMessage = {
              severity: 'WARNING',
              message: 'Image ' + outerHTML + ': has an "alt" attribute same as its "src"'
            };
          } else if (minWidth && minWidth > alt.length) {
            logMessage = {
              severity: 'WARNING',
              message: 'Image ' + outerHTML + ': has a short "alt" attribute which is less than ' + minWidth + ' characters.'
            };
          } else if (maxWidth && maxWidth < alt.length) {
            logMessage = {
              severity: 'WARNING',
              message: 'Image ' + outerHTML + ': has a long "alt" attribute which is bigger than ' + maxWidth + ' characters.'
            }
          }
          
          if (logMessage) {
            that.log(logMessage);
          }
        },

        process = function (image) {
          checkAltAttribute(image);
        };

      if (images.length === 0) {
        that.complete({
          severity: 'INFO',
          message: 'No images found in the source.'
        });
        return;
      }

      var i, length = images.length;

      for (i = 0; i < length; ++i) {
        process(images[i]);
      }
      
      that.complete({
        severity: 'INFO',
        message: 'Complete.'
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