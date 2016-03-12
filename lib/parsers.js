"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (Babylon) {
  var pp = Babylon.pp;
  var tt = Babylon.tt;


  pp.cssxParse = function () {
    var lastToken = this.cssxGetPreviousToken();
    var definition = this.startNodeAt(lastToken.start, lastToken.loc.start);

    this.skipSpace();
    this.cssxReadSelector();
    this.parseBlockBody(definition, true, false, tt.cssxEnd);
    this.finishNode(definition, "CSSXDefinition");
    return definition;
  };

  pp.cssxParseExpression = function () {
    var exprNode = void 0,
        lastToken = void 0,
        result = void 0;

    lastToken = this.cssxGetPreviousToken();
    exprNode = this.startNodeAt(lastToken.start, lastToken.loc.start);
    exprNode.body = [];

    while (this.match(tt.cssxSelector)) {
      if (this.cssxIsMediaQuery()) {
        exprNode.body.push(this.cssxParseMediaQueryElement());
      } else if (this.cssxIsKeyFramesEntryPoint()) {
        exprNode.body.push(this.cssxParseKeyframesElement());
      } else {
        exprNode.body.push(this.cssxParseElement());
      }
    }

    result = this.finishNodeAt(exprNode, "CSSXExpression", this.state.end, this.state.endLoc);
    this.next();
    return result;
  };

  pp.cssxParseElement = function () {
    var elementNode = void 0,
        selectorNode = void 0,
        result = void 0,
        lastToken = void 0;

    elementNode = this.startNodeAt(this.state.start, this.state.startLoc);
    selectorNode = this.startNodeAt(this.state.start, this.state.startLoc);

    selectorNode.value = this.state.value;
    this.cssxExpressionSet(selectorNode);
    elementNode.selector = this.finishNodeAt(selectorNode, "CSSXSelector", this.state.end, this.state.endLoc);
    this.next();
    if (!this.match(tt.cssxRulesEnd)) {
      elementNode.body = this.parseBlock();
    }
    lastToken = this.cssxGetPreviousToken();
    result = this.finishNodeAt(elementNode, "CSSXElement", lastToken.end, lastToken.loc.end);
    this.nextToken();
    return result;
  };

  pp.cssxParseMediaQueryElement = function () {
    var _this = this;

    return this.cssxParseNestedSelectors({
      name: "CSSXMediaQueryElement",
      context: {
        in: function _in() {
          return _this.cssxMediaQueryIn();
        }
      },
      tokens: {
        el: tt.cssxMediaQuery,
        start: tt.cssxMediaQueryStart,
        end: tt.cssxMediaQueryEnd
      },
      errors: {
        unclosed: "CSSX: unclosed media query block",
        expectSelector: "CSSX: expected css selector after media query definition"
      }
    });
  };

  pp.cssxParseKeyframesElement = function () {
    var _this2 = this;

    return this.cssxParseNestedSelectors({
      name: "CSSXKeyframesElement",
      context: {
        in: function _in() {
          return _this2.cssxKeyframesIn();
        }
      },
      tokens: {
        el: tt.cssxKeyframes,
        start: tt.cssxKeyframesStart,
        end: tt.cssxKeyframesEnd
      },
      errors: {
        unclosed: "CSSX: unclosed @keyframes block",
        expectSelector: "CSSX: expected keyframe as a start of the @keyframes block"
      }
    });
  };

  pp.cssxParseNestedSelectors = function (options) {
    var nestedElement = void 0,
        result = void 0;
    nestedElement = this.startNodeAt(this.state.start, this.state.startLoc);
    nestedElement.query = this.state.value;

    this.cssxExpressionSet(nestedElement);
    options.context.in();
    this.cssxFinishTokenAt(options.tokens.el, this.state.value, this.state.end, this.state.endLoc);
    this.cssxStoreCurrentToken();

    if (!this.cssxMatchNextToken(tt.braceL)) {
      this.raise(this.state.pos, "CSSX: expected { after query definition");
    }

    ++this.state.pos;
    this.finishToken(options.tokens.start);

    if (this.cssxMatchNextToken(tt.braceR)) {
      // empty media query
      this.cssxStoreCurrentToken();
      this.skipSpace();
      this.cssxSyncLocPropsToCurPos();
    } else {
      this.next();
      nestedElement.body = [];
      if (this.match(tt.cssxSelector)) {
        nestedElement.body.push(this.cssxParseElement());
        while (!this.cssxMatchNextToken(tt.braceR)) {
          if (this.match(tt.cssxRulesEnd)) {
            this.cssxReadSelector();
          }
          if (this.cssxMatchNextToken(tt.parenR)) {
            this.raise(this.state.pos, options.errors.unclosed);
          }
          nestedElement.body.push(this.cssxParseElement());
        }
      } else {
        this.raise(this.state.pos, options.errors.expectSelector);
      }
    }

    ++this.state.pos;
    this.finishToken(options.tokens.end);
    result = this.finishNodeAt(nestedElement, options.name, this.state.end, this.state.endLoc);
    this.next();
    return result;
  };

  pp.cssxParseRule = function (propertyNode, valueNode) {
    var node = this.startNodeAt(propertyNode.start, propertyNode.loc.start);
    var pos = valueNode.end;
    var locEnd = this.cssxClonePosition(valueNode.loc.end);

    if (this.match(tt.semi) || this.match(tt.cssxRulesEnd) && this.cssxMatchPreviousToken(tt.semi, 1)) {
      ++locEnd.column;
      ++pos;
    }

    node.label = propertyNode;
    node.body = valueNode;

    return this.finishNodeAt(node, "CSSXRule", pos, locEnd);
  };

  pp.cssxParseRuleChild = function (type, value, pos, loc) {
    var node = this.startNodeAt(pos, loc);

    this.cssxExpressionSet(node);
    node.name = value;
    return this.finishNodeAt(node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
  };
};