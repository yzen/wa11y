/*global module, describe:true, it:true, expect:true*/
(function (module) {

  "use strict";

  module.exports = function (wa11y, expect) {
    describe("wai-img", function () {
      var simpleSource = '<p><a class="the-link" href="https://github.com/yzen/wa11y">wa11y\'s Homepage</a></p>',
        imageNoAltSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" /></p>',
        imageEmptyAltSource = '<p><img class="the-link" src="http://www.w3.org/WAI/images/wai-temp" alt=""/></p>',
        testValidator;
            
/*
      beforeEach(function (done) {
        testValidator = wa11y.init();
        testValidator.configure({
          rules: {
            "wai-img": {}
          }
        });
        done();
      });
*/
            
      it("No images in the source", function (done) {
        // TODO: expect(1)
        testValidator = wa11y.init();
        testValidator.configure({
          rules: {
            "wai-img": {}
          }
        });
                
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
            
/*
      it("Image with no ALT", function (done) {
        // TODO: expect(1)
        testValidator = wa11y.init();
        testValidator.configure({
          rules: {
            "wai-img": {}
          }
        });

        testValidator.on("complete", function (log) {                 
          var key, docId, thisLog;
          for (key in log) {
            for (docId in log[key]) {
              thisLog = log[key][docId];
              console.log(thisLog);
              expect(thisLog).to.deep.equal({
                ERROR: ['x'],
                INFO: ['Complete.']
              });
            }
          }
          done();
        });
        testValidator.run(imageNoAltSource);
      });

      it("Image with empty ALT", function (done) {
        // TODO: expect(1)
        testValidator = wa11y.init();
        testValidator.configure({
          rules: {
            "wai-img": {}
          }
        });

      testValidator.on("complete", function (log) {
        var key, docId, thisLog;
        for (key in log) {
          for (docId in log[key]) {
            thisLog = log[key][docId];
            expect(thisLog).to.deep.equal({
              ERROR: ['x'],
              INFO: ['Complete.']
            });
          }
        }
        done();
        });
      testValidator.run(imageEmptyAltSource);
      });
*/
    });
  };
})(module);