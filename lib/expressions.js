"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (Babylon) {
  var pp = Babylon.pp;


  pp.cssxExpressionRegister = function (expressions) {
    if (expressions && expressions.length > 0) {
      this.state._cssxExpressions = expressions;
    }
  };
  pp.cssxExpressionSet = function (node) {
    var _this = this;

    var length = void 0,
        codeStr = void 0;

    if (this.state._cssxExpressions && this.state._cssxExpressions.length > 0) {
      node.expressions = this.state._cssxExpressions.map(function (expr) {
        length = expr.end - expr.start;
        codeStr = _this.state.input.substr(expr.start, length).substr(1, length - 2);
        if (codeStr === "") return false;
        return {
          start: expr.start,
          end: expr.end,
          contextLoc: {
            start: expr.inner.start,
            end: expr.inner.end
          }
        };
      }).filter(function (expr) {
        return expr !== false;
      });
    }
    this.state._cssxExpressions = false;
  };
};

module.exports = exports['default'];