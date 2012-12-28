/*global module, describe:true, it:true, expect:true*/
(function (module) {

  "use strict";

  module.exports = function (wa11y, expect) {
    describe("wai-img", function () {
      var simpleSource = '<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>',
        imageNoAltSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" /></p>',
        imageEmptyAltSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt=""/></p>',
        imageAltAsSrcSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="http://www.w3.org/WAI/images/wai-temp"/></p>',
        imageGoodSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="Hi I am here to help you"/></p>',
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
        // TODO: expect(1)
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
        testValidator.run(simpleSource);
      });
      
      it('Image with no "alt" attribute', function (done) {
        // TODO: expect(1)
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              console.log(thisLog);
              expect(thisLog).to.deep.equal({
                ERROR: ['Image <img class="the-link" src="http://www.w3.org/WAI/images/wai-temp">: does not have an "alt" attribute'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(imageNoAltSource);
      });

      it('Image with an empty "alt" attribute', function (done) {
        // TODO: expect(1)
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                ERROR: ['Image <img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="">: does not have an "alt" attribute'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(imageEmptyAltSource);
      });
      
      it('Image with an "alt" attribute equal to "src"', function (done) {
        // TODO: expect(1)
        testValidator.on("complete", function (log) {
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              expect(thisLog).to.deep.equal({
                WARNING: ['Image <img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt="http://www.w3.org/WAI/images/wai-temp">: has an "alt" attribute same as its "src"'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(imageAltAsSrcSource);
      });
      
      it('Image with a proper "alt" attribute', function (done) {
        // TODO: expect(1)
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
        testValidator.run(imageGoodSource);
      });
      
    });
  };
})(module);