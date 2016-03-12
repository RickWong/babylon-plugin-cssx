"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (Babylon) {
  var TokenType = Babylon.TokenType;
  var tt = Babylon.tt;
  var tc = Babylon.tc;


  tt.cssxStart = new TokenType("CSSXStart");
  tt.cssxEnd = new TokenType("CSSXEnd");
  tt.cssxSelector = new TokenType("CSSXSelector");
  tt.cssxRulesStart = new TokenType("CSSXRulesStart");
  tt.cssxRulesEnd = new TokenType("CSSXRulesEnd");
  tt.cssxProperty = new TokenType("CSSXProperty");
  tt.cssxValue = new TokenType("CSSXValue");
  tt.cssxMediaQuery = new TokenType("CSSXMediaQuery");
  tt.cssxMediaQueryStart = new TokenType("CSSXMediaQueryStart");
  tt.cssxMediaQueryEnd = new TokenType("CSSXMediaQueryEnd");
  tt.cssxKeyframes = new TokenType("CSSXKeyframes");
  tt.cssxKeyframesStart = new TokenType("CSSXKeyframesStart");
  tt.cssxKeyframesEnd = new TokenType("CSSXKeyframesEnd");

  tt.cssxRulesStart.updateContext = function (prevType) {
    if (prevType === tt.cssxSelector) this.state.context.push(tc.cssxRules);
  };
  tt.cssxRulesEnd.updateContext = function (prevType) {
    if (prevType === tt.cssxValue || prevType === tt.cssxRulesStart || prevType === tt.semi) {
      this.state.context.length -= 1; // out of cssxRules
    }
  };
  tt.cssxEnd.updateContext = function () {
    this.cssxDefinitionOut();
    this.cssxOut();
  };
  tt.cssxSelector.updateContext = function () {
    this.state.context.length -= 1;
  };

  tt.cssxMediaQueryEnd.updateContext = function () {
    this.cssxMediaQueryOut();
  };

  tt.cssxKeyframesEnd.updateContext = function () {
    this.cssxKeyframesOut();
  };
};

;
module.exports = exports['default'];