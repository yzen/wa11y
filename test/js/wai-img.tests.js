/*global module, describe:true, it:true, expect:true*/
(function (module) {

  "use strict";

  module.exports = function (wa11y, expect) {
    describe("wai-img", function () {
      var createMarkup = function (innerHtml) {
          return '<p>' + innerHtml + '</p>';
        },
        simpleSource = '<a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a>',
        imageNoAltSource = '<img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" />',
        imageEmptyAltSource = '<img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="" />',
        imageAltAsSrcSource = '<img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="http://www.w3.org/WAI/images/wai-temp" />',
        imageSpaceAltSource = '<img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="    " />',
        imageGoodSource = '<img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="Hi I am here to help you" />',
        testValidator;
      
      beforeEach(function (done) {
        testValidator = wa11y.init();
        testValidator.configure({
          rules: {
            "wai-img": {}
          }
        });
        done();
      });

      it('No images in the source', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                INFO: ["No images found in the source."]
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(simpleSource));
      });
      
      it('Image with no "alt" attribute', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                ERROR: ['Image ' + imageNoAltSource + ': does not have an "alt" attribute'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageNoAltSource));
      });

      it('Image with an empty "alt" attribute', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                ERROR: ['Image ' + imageEmptyAltSource + ': does not have an "alt" attribute'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageEmptyAltSource));
      });
      
      it('Image with an "alt" attribute equal to "src"', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                WARNING: ['Image ' + imageAltAsSrcSource + ': has an "alt" attribute same as its "src"'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageAltAsSrcSource));
      });
      
      it('Image with an "alt" attribute which has spaces in it', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                ERROR: ['Image ' + imageSpaceAltSource + ': has an invalid "alt" attribute'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageSpaceAltSource));
      });
      
      it('Image with a proper "alt" attribute', function (done) {
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageGoodSource));
      });
      
      it('Image with a proper "alt" attribute less than minWidth option', function (done) {
        var minWidth = 100;
        
        testValidator.configure({
          rules: {
            "wai-img": {
              minWidth: minWidth
            }
          }
        });
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                WARNING: ['Image ' + imageGoodSource + ': has a short "alt" attribute which is less than ' + minWidth + ' characters.'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageGoodSource));
      });
      
      it('Image with a proper "alt" attribute bigger than maxWidth option', function (done) {
        var maxWidth = 5;
        
        testValidator.configure({
          rules: {
            "wai-img": {
              maxWidth: maxWidth
            }
          }
        });
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                WARNING: ['Image ' + imageGoodSource + ': has a long "alt" attribute which is bigger than ' + maxWidth + ' characters.'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(createMarkup(imageGoodSource));
      });
      
    });
  };
})(module);