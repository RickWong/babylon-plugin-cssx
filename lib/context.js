"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (Babylon) {
  var TokContext = Babylon.TokContext;
  var tc = Babylon.tc;
  var pp = Babylon.pp;


  tc.cssx = new TokContext("cssx");
  tc.cssxDefinition = new TokContext("cssxDefinition");
  tc.cssxSelector = new TokContext("cssxSelector");
  tc.cssxRules = new TokContext("cssxRules");
  tc.cssxProperty = new TokContext("cssxProperty");
  tc.cssxValue = new TokContext("cssxValue");
  tc.cssxMediaQuery = new TokContext("CSSXMediaQuery");
  tc.cssxKeyframes = new TokContext("CSSXKeyframes");

  var registerInOut = function registerInOut(name, context) {
    pp["cssx" + name + "In"] = function () {
      var curContext = this.curContext();

      if (_utilities.eq.context(curContext, context)) return;
      this.state.context.push(context);
    };

    pp["cssx" + name + "Out"] = function () {
      var curContext = this.curContext();

      if (!_utilities.eq.context(curContext, context)) {
        this.raise(this.state.start, "CSSX: Not in " + context.token + " context");
      }
      this.state.context.length -= 1;
    };
  };

  registerInOut("", tc.cssx);
  registerInOut("MediaQuery", tc.cssxMediaQuery);
  registerInOut("Keyframes", tc.cssxKeyframes);
  registerInOut("Definition", tc.cssxDefinition);
};

var _utilities = require("./utilities");

module.exports = exports['default'];