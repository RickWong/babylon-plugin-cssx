(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cssx = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./utilities":9}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

exports.default = function (Babylon) {
  var Token = Babylon.Token;
  var pp = Babylon.pp;


  var MediaQueryEntryPoint = "@media ";
  var keyframesEntryPoint = ["@keyframes", "@-webkit-keyframes", "@-moz-keyframes", "@-o-keyframes"];

  pp.cssxIsMediaQuery = function () {
    if (this.state.value.toString().indexOf(MediaQueryEntryPoint) === 0) {
      return true;
    }
    return false;
  };

  pp.cssxIsKeyFramesEntryPoint = function () {
    var value = this.state.value.toString().split(" ")[0];
    if (keyframesEntryPoint.indexOf(value) >= 0) {
      return true;
    }
    return false;
  };

  pp.cssxGetPreviousToken = function () {
    var steps = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

    return this.state.tokens[this.state.tokens.length - (steps + 1)];
  };

  pp.cssxMatchPreviousToken = function (type, step) {
    var previous = this.cssxGetPreviousToken(step);

    if (previous && _utilities.eq.type(previous.type, type)) return true;
    return false;
  };

  pp.cssxMatchNextToken = function () {
    var next = void 0,
        nextA = void 0,
        nextB = void 0,
        old = void 0;

    if (arguments.length === 1) {
      next = this.lookahead();
      if (next && _utilities.eq.type(next.type, arguments[0])) return true;
      return false;
    } else if (arguments.length === 2) {
      old = this.state;
      this.state = old.clone(true);

      this.isLookahead = true;
      this.next();
      nextA = this.state.clone(true);
      this.next();
      nextB = this.state.clone(true);
      this.isLookahead = false;
      this.state = old;
      if (nextA && _utilities.eq.type(nextA.type, arguments[0]) && nextB && _utilities.eq.type(nextB.type, arguments[1])) {
        return true;
      }
      return false;
    }
  };

  pp.cssxLookahead = function () {
    var numOfTokens = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

    var old = this.state;
    var stack = [];

    this.state = old.clone(true);

    this.isLookahead = true;
    while (numOfTokens > 0) {
      try {
        this.next();
        stack.push(this.state.clone(true));
      } catch (e) {
        // The next token cannot be parsed.
        // We still put something in the stack though so we
        // don"t break the logic that uses the result of
        // this function
        stack.push({ type: null });
      }
      --numOfTokens;
    }
    this.isLookahead = false;
    this.state = old;

    return {
      stack: stack,
      last: stack[stack.length - 1],
      first: stack[0]
    };
  };

  pp.cssxClonePosition = function (loc) {
    return {
      line: loc.line,
      column: loc.column
    };
  };

  pp.cssxDebugComments = function (comments) {
    if (!comments || comments.length === 0) return null;
    return (0, _stringify2.default)(comments.map(function (c) {
      return { type: c.type, value: c.value };
    }));
  };

  pp.cssxClearSpaceAtTheEnd = function (value) {
    if (value.charAt(value.length - 1) === " ") {
      --this.state.pos;
      return value.substr(0, value.length - 1);
    }
    return value;
  };

  pp.cssxFinishTokenAt = function (type, val, pos, loc) {
    this.state.end = pos;
    this.state.endLoc = loc;
    var prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;

    this.updateContext(prevType);
  };

  pp.replaceCurrentTokenType = function (type) {
    this.state.type = type;
  };

  pp.cssxStoreNextCharAsToken = function (type) {
    var curContext = this.curContext();

    ++this.state.pos;
    this.finishToken(type);

    this.state.tokens.push(new Token(this.state));
    if (!curContext || !curContext.preserveSpace) this.skipSpace();
    this.cssxSyncLocPropsToCurPos();
  };

  pp.cssxStoreCurrentToken = function () {
    this.state.tokens.push(new Token(this.state));
    this.cssxSyncLocPropsToCurPos();
  };

  pp.cssxSyncLocPropsToCurPos = function (p) {
    var pos = typeof p === "undefined" ? this.state.pos : p;

    this.state.start = this.state.end = pos;
    this.state.startLoc = this.state.endLoc = (0, _utilities.posToLoc)(pos, this.state.input);
  };

  pp.cssxSyncEndTokenStateToCurPos = function () {
    var meta = (0, _utilities.posToLoc)(this.state.pos, this.state.input, true);

    this.state.endLoc.line = meta.line;
    this.state.endLoc.column = meta.column;
    this.state.lineStart = meta.lineStart;
    this.state.curLine = meta.curLine;
  };
};

var _utilities = require("./utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
},{"./utilities":9,"babel-runtime/core-js/json/stringify":10}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CSSX;

var _types = require('../../babylon/lib/tokenizer/types');

var _context = require('../../babylon/lib/tokenizer/context');

var _tokenizer = require('../../babylon/lib/tokenizer');

var _identifier = require('../../babylon/lib/util/identifier');

var _utilities = require('./utilities');

var _context2 = require('./context');

var _context3 = _interopRequireDefault(_context2);

var _expressions = require('./expressions');

var _expressions2 = _interopRequireDefault(_expressions);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

var _readers = require('./readers');

var _readers2 = _interopRequireDefault(_readers);

var _types2 = require('./types');

var _types3 = _interopRequireDefault(_types2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Babylon = {
  tt: _types.types, tc: _context.types, TokContext: _context.TokContext, Token: _tokenizer.Token, TokenType: _types.TokenType, isIdentifierChar: _identifier.isIdentifierChar, isIdentifierStart: _identifier.isIdentifierStart
};

function CSSX(Parser) {
  return {
    pluginName: 'cssx',
    pluginFunc: function CSSX(instance) {

      var pp = Babylon.pp = Parser.prototype;

      (0, _context3.default)(Babylon);
      (0, _expressions2.default)(Babylon);
      (0, _helpers2.default)(Babylon);
      (0, _parsers2.default)(Babylon);
      (0, _readers2.default)(Babylon);
      (0, _types3.default)(Babylon);

      instance.extend('parseStatement', function (inner) {
        return function (declaration, topLevel) {
          if (this.cssxMatchPreviousToken(_types.types.cssxStart) && !_utilities.eq.context(this.curContext(), _context.types.cssxDefinition)) {
            this.cssxDefinitionIn();
            return this.cssxParse();
          } else if (this.match(_types.types.cssxSelector)) {
            if (this.cssxIsMediaQuery()) {
              return this.cssxParseMediaQueryElement();
            } else if (this.cssxIsKeyFramesEntryPoint()) {
              return this.cssxParseKeyframesElement();
            }
            return this.cssxParseElement();
          }
          return inner.call(this, declaration, topLevel);
        };
      });

      instance.extend('parseBlock', function (inner) {
        return function (allowDirectives) {
          var _this = this;

          var fallback = function fallback() {
            return inner.call(_this, allowDirectives);
          };
          var context = this.curContext(),
              blockStmtNode = void 0;
          var rules = [],
              lastToken = void 0;

          if (_utilities.eq.context(context, _context.types.cssxRules) && this.match(_types.types.cssxRulesStart)) {

            blockStmtNode = this.startNode();
            // no rules
            if (this.match(_types.types.cssxRulesStart) && _utilities.eq.type(this.lookahead().type, _types.types.braceR)) {
              this.next();
            } else {
              // reading the style         
              while (!this.match(_types.types.cssxRulesEnd) && !this.match(_types.types.eof)) {
                rules.push(this.cssxParseRule(this.cssxReadProperty(), this.cssxReadValue()));
              }
              if (this.state.pos >= this.input.length) this.finishToken(_types.types.eof);
            }
            blockStmtNode.body = rules;
            lastToken = this.cssxGetPreviousToken();
            return this.finishNodeAt(blockStmtNode, 'CSSXRules', lastToken.end, lastToken.loc.end);
          }

          return fallback();
        };
      });

      instance.extend('readToken', function (inner) {
        return function (code) {
          var _this2 = this;

          var fallback = function fallback() {
            return inner.call(_this2, code);
          };
          var context = this.curContext();

          if (this.isLookahead) return fallback();

          if (this.match(_types.types.cssxSelector) && this.cssxMatchNextToken(_types.types.braceL)) {
            ++this.state.pos;
            return this.finishToken(_types.types.cssxRulesStart);
          } else if (this.match(_types.types.cssxSelector) && this.cssxMatchNextToken(_types.types.parenR)) {
            this.finishToken(_types.types.cssxRulesEnd);
            return;
          } else if (this.match(_types.types.cssxRulesStart)) {
            // no styles
            if (this.cssxMatchNextToken(_types.types.braceR)) {
              return this.cssxStoreNextCharAsToken(_types.types.cssxRulesEnd);
            } else {
              return this.finishToken(_types.types.cssxRulesStart);
            }
            // matching the : between the property and the value
          } else if (this.match(_types.types.cssxProperty) && code === 58) {
              // 58 = :       
              return this.cssxStoreNextCharAsToken(_types.types.colon);
              // matching the semicolon at the end of the rule
            } else if (this.match(_types.types.cssxValue) && code === 59) {
                // 59 = ;
                this.cssxStoreNextCharAsToken(_types.types.semi);
                // eding with semicolon
                if (this.cssxMatchNextToken(_types.types.braceR)) {
                  this.cssxStoreNextCharAsToken(_types.types.cssxRulesEnd);
                }
                return;
              } else if (this.match(_types.types.cssxValue) && this.cssxMatchNextToken(_types.types.braceR)) {
                // ending without semicolon
                return this.cssxStoreNextCharAsToken(_types.types.cssxRulesEnd);
              } else if (this.match(_types.types.cssxRulesEnd) && _utilities.eq.context(context, _context.types.cssxMediaQuery) || this.match(_types.types.cssxRulesEnd) && _utilities.eq.context(context, _context.types.cssxKeyframes)) {
                // end of media query
                return;
              } else if (this.match(_types.types.cssxRulesEnd) && this.cssxMatchNextToken(_types.types.parenR) || this.match(_types.types.cssxMediaQueryEnd) && this.cssxMatchNextToken(_types.types.parenR) || this.match(_types.types.cssxKeyframesEnd) && this.cssxMatchNextToken(_types.types.parenR)) {
                ++this.state.pos;
                this.finishToken(_types.types.cssxEnd);
                return;
              }

          // cssx entry point
          if (this.cssxEntryPoint()) {
            return;
          }

          // looping through the cssx elements
          if (_utilities.eq.context(context, _context.types.cssxDefinition) || _utilities.eq.context(context, _context.types.cssxMediaQuery) || _utilities.eq.context(context, _context.types.cssxKeyframes)) {
            this.skipSpace();
            return this.cssxReadSelector();
          }

          return fallback();
        };
      });

      instance.extend('getTokenFromCode', function (inner) {
        return function (code) {
          var _this3 = this;

          var fallback = function fallback() {
            return inner.call(_this3, code);
          };

          // when the selector starts with #
          if (code === 35 && (this.match(_types.types.cssxStart) || this.match(_types.types.cssxRulesEnd))) {
            ++this.state.pos;
            return this.finishToken(_types.types.string, '#');
          }

          return fallback();
        };
      });

      instance.extend('parseExprAtom', function (inner) {
        return function (refShortHandDefaultPos) {
          if (this.match(_types.types.cssxStart)) {
            this.cssxDefinitionIn();
            return this.cssxParse();
          }
          return inner.call(this, refShortHandDefaultPos);
        };
      });

      instance.extend('processComment', function (inner) {
        return function (node) {
          if (node.type === 'CSSXRule') {
            this.state.trailingComments.length = 0;
            this.state.leadingComments.length = 0;
          }
          return inner.call(this, node);
        };
      });

      pp.cssxEntryPoint = function () {
        var nextToken = this.lookahead();
        var parenL = void 0,
            future = void 0,
            cState = void 0,
            firstInCSSX = void 0;

        if (_utilities.eq.type(nextToken.type, _types.types.name) && nextToken.value === 'cssx' && this.cssxMatchNextToken(_types.types.name, _types.types.parenL)) {
          cState = this.state.clone();
          future = this.cssxLookahead(3);
          parenL = future.stack[1];
          firstInCSSX = future.stack[2];

          // Making sure that we don't parse
          // cssx('something') or cssx('something')
          if (_utilities.eq.type(firstInCSSX.type, _types.types.string)) {
            return false;
          }

          this.cssxIn();
          this.state.pos = parenL.end;
          this.finishToken(_types.types.cssxStart);
          this.cssxSyncEndTokenStateToCurPos();
          if (this.cssxMatchNextToken(_types.types.parenR)) {
            this.state = cState;
            return false;
          }
          this.cssxStoreCurrentToken();
          return true;
        }
        return false;
      };

      pp.cssxRulesEntryPoint = function () {
        return this.match(_types.types.braceL) && this.cssxMatchNextToken(_types.types.name, _types.types.colon);
      };
    }
  };
}

// /* useful watchers

// watch('this.state.type.label')
// watch('this.state.pos')
// watch('this.state.start')
// watch('this.state.end')
// watch('this.state.startLoc')
// watch('this.state.endLoc')
// watch('this.state.input.substr(0, this.state.pos)')
// watch('this.state.context.map(function(i){return i.token}).join(',')')
// watch('this.lookahead().type.label')

// watch('String.fromCharCode(ch) + ' / ' + ch')

// */
module.exports = exports['default'];
},{"../../babylon/lib/tokenizer":14,"../../babylon/lib/tokenizer/context":13,"../../babylon/lib/tokenizer/types":16,"../../babylon/lib/util/identifier":17,"./context":1,"./expressions":2,"./helpers":3,"./parsers":5,"./readers":6,"./types":8,"./utilities":9}],5:[function(require,module,exports){
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

module.exports = exports['default'];
},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (Babylon) {
  var pp = Babylon.pp;
  var tt = Babylon.tt;
  var tc = Babylon.tc;
  var isIdentifierChar = Babylon.isIdentifierChar;
  var isIdentifierStart = Babylon.isIdentifierStart;


  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) {
      return String.fromCharCode(code);
    } else {
      return String.fromCharCode((code - 0x10000 >> 10) + 0xD800, (code - 0x10000 & 1023) + 0xDC00);
    }
  }

  pp.cssxReadWord = function (readUntil) {
    var _this = this;

    var word = "";
    var first = true;
    var chunkStart = void 0,
        cut = void 0,
        cutPart = void 0;
    var readingDataURI = false;
    var readingNth = false;
    var readingExpression = false;
    var dataURIPattern = ["url(data:", 41]; // 41 = )
    var expressionStartPatterns = ["`", "{{", "<%"];
    var expressionEndPattern = ["`", "}}", "%>"];
    var nthPattern = [40, 41]; // 40 = (, 41 = )
    var expression = false;
    var expressions = [];
    var numOfCharRead = 0;
    var expressionMarkerLength = null;

    chunkStart = this.state.pos;
    cut = function cut() {
      return _this.input.slice(chunkStart, _this.state.pos);
    };
    cutPart = function cutPart(length) {
      return _this.input.substr(_this.state.pos, length);
    };

    this.state.containsEsc = false;

    var _loop = function _loop() {
      var expressionStartPos = null;
      var ch = _this.fullCharCodeAtPos();
      var pos = _this.state.pos;
      if (cut() === dataURIPattern[0]) readingDataURI = true;
      if (ch === dataURIPattern[1]) readingDataURI = false;

      expressionStartPatterns.forEach(function (esp) {
        if (cutPart(esp.length) === esp && !readingExpression) {
          readingExpression = true;
          expressionStartPos = pos;
          expressionMarkerLength = esp.length;
        }
      });

      expressionEndPattern.forEach(function (eep) {
        if (cutPart(eep.length) === eep && pos !== expressionStartPos) {
          readingExpression = false;
        }
      });

      if (ch === nthPattern[0]) readingNth = true;

      if (readUntil.call(_this, ch) || readingDataURI || readingNth || readingExpression || expression !== false) {

        var inc = ch <= 0xffff ? 1 : 2;
        _this.state.pos += inc;

        // expression block end detection
        if (!readingExpression && expression) {
          if (expressionMarkerLength > 1) {
            _this.state.pos += expressionMarkerLength - 1;
          }
          expression.end = _this.state.pos;
          expression.inner.end = numOfCharRead + expressionMarkerLength;
          expressions.push(expression);
          expression = false;
          if (expressionMarkerLength > 1) {
            numOfCharRead += expressionMarkerLength - 1;
          }
          // expression block start detection
        } else if (readingExpression && !expression) {
            expression = {
              start: _this.state.pos - 1,
              inner: { start: numOfCharRead }
            };
          }

        // new line detection
        if (ch === 10) {
          // new line
          ++_this.state.curLine;
          _this.state.lineStart = _this.state.pos;
        }
      } else if (ch === 92) {
        // "\"
        _this.state.containsEsc = true;

        word += _this.input.slice(chunkStart, _this.state.pos);
        var escStart = _this.state.pos;

        if (_this.input.charCodeAt(++_this.state.pos) !== 117) {
          // "u"
          _this.raise(_this.state.pos, "CSSX: expecting Unicode escape sequence \\uXXXX");
        }

        ++_this.state.pos;
        var esc = _this.readCodePoint();
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, true)) {
          _this.raise(escStart, "CSSX: invalid Unicode escape");
        }

        word += codePointToString(esc);
        chunkStart = _this.state.pos;
      } else {
        return "break";
      }
      if (ch === nthPattern[1]) readingNth = false;
      first = false;
      ++numOfCharRead;
    };

    while (this.state.pos < this.input.length) {
      var _ret = _loop();

      if (_ret === "break") break;
    }
    word = word + cut();
    return { str: word, expressions: expressions };
  };

  pp.cssxReadSelector = function () {
    var startLoc = void 0,
        pos = void 0,
        value = void 0,
        word = void 0;
    this.state.context.push(tc.cssxSelector);
    startLoc = this.state.curPosition();
    pos = this.state.pos;

    word = this.cssxReadWord(pp.cssxReadSelectorCharUntil);
    value = this.cssxClearSpaceAtTheEnd(word.str);

    this.cssxExpressionRegister(word.expressions);
    this.state.startLoc = startLoc;
    this.state.start = pos;
    this.finishToken(tt.cssxSelector, value);
    this.skipSpace();
  };

  pp.cssxReadProperty = function () {
    var loc = void 0,
        pos = void 0,
        property = void 0,
        node = void 0,
        word = void 0;

    if (this.match(tt.cssxRulesStart)) this.next();

    loc = this.state.curPosition();
    pos = this.state.pos;

    word = this.cssxReadWord(pp.cssxReadPropCharUntil);
    property = word.str;

    if (property === "") {
      this.raise(this.state.pos, "CSSX: no CSS property provided");
    }

    this.cssxExpressionRegister(word.expressions);
    this.state.startLoc = loc;
    this.state.start = pos;

    this.finishToken(tt.cssxProperty, property);

    if (!_utilities.eq.type(this.lookahead().type, tt.colon)) {
      this.raise(this.state.pos, "CSSX: expecting a colon after CSS property");
    }
    this.next();
    node = this.cssxParseRuleChild("CSSXProperty", property, pos, loc);

    return node;
  };

  pp.cssxReadValue = function () {
    var startLoc = void 0,
        pos = void 0,
        value = void 0,
        node = void 0,
        word = void 0;

    startLoc = this.state.curPosition();
    pos = this.state.pos;
    word = this.cssxReadWord(pp.cssxReadValueCharUntil);
    value = this.cssxClearSpaceAtTheEnd(word.str); // changes state.pos

    this.cssxExpressionRegister(word.expressions);
    this.state.start = pos;
    this.state.startLoc = startLoc;
    this.finishToken(tt.cssxValue, value);
    this.next();
    node = this.cssxParseRuleChild("CSSXValue", value, pos, startLoc);

    return node;
  };

  pp.cssxReadSelectorCharUntil = function (code) {
    if (_settings.CSSXSelectorAllowedCodes.indexOf(code) >= 0 || (0, _utilities.isNumber)(code)) {
      // check for allow characters
      return true;
    } else if (code === 123) {
      // end the selector with {
      return false;
    }
    return isIdentifierChar(code);
  };

  pp.cssxReadValueCharUntil = function (code) {
    return _settings.CSSXValueAllowedCodes.indexOf(code) >= 0 ? true : isIdentifierChar(code);
  };

  pp.cssxReadPropCharUntil = function (code) {
    return _settings.CSSXPropertyAllowedCodes.indexOf(code) >= 0 ? true : isIdentifierChar(code);
  };
};

var _settings = require("./settings");

var _utilities = require("./utilities");

;
module.exports = exports['default'];
},{"./settings":7,"./utilities":9}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CSSXSelectorAllowedCodes = exports.CSSXValueAllowedCodes = exports.CSSXPropertyAllowedCodes = undefined;

var _utilities = require("./utilities");

var CSSXPropertyAllowedCodes = exports.CSSXPropertyAllowedCodes = ["-"].map(_utilities.stringToCode);

var CSSXValueAllowedCodes = exports.CSSXValueAllowedCodes = [" ", "\n", "\t", "#", ".", "-", "(", ")", "[", "]", "'", "\"", "%", ",", ":", "/", "\\", "!", "?"].map(_utilities.stringToCode);

var CSSXSelectorAllowedCodes = exports.CSSXSelectorAllowedCodes = [" ", "*", ">", "+", "~", ".", ":", "=", "[", "]", "\"", "-", "!", "?", "@", "#", "$", "%", "^", "&", "'", "|", ",", "\n"].map(_utilities.stringToCode);
},{"./utilities":9}],8:[function(require,module,exports){
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
    if (_utilities.eq.type(prevType, tt.cssxSelector)) this.state.context.push(tc.cssxRules);
  };
  tt.cssxRulesEnd.updateContext = function (prevType) {
    if (_utilities.eq.type(prevType, tt.cssxValue) || _utilities.eq.type(prevType, tt.cssxRulesStart) || _utilities.eq.type(prevType, tt.semi)) {
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

var _utilities = require("./utilities");

;
module.exports = exports['default'];
},{"./utilities":9}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringToCode = stringToCode;
exports.posToLoc = posToLoc;
exports.isNumber = isNumber;
function stringToCode(ch) {
  return String(ch).charCodeAt(0);
}

function posToLoc(pos, input, verbose) {
  var line = 1,
      loopPos = 0,
      linePos = 0,
      lineStart = 0;

  while (loopPos < input.length && loopPos !== pos) {
    if (input.charAt(loopPos) === "\n") {
      linePos = 0;
      lineStart = loopPos + 1;
      ++line;
    } else {
      ++linePos;
    }
    ++loopPos;
  }
  if (!verbose) {
    return { line: line, column: linePos };
  } else {
    return {
      line: line,
      curLine: line,
      column: linePos,
      lineStart: lineStart
    };
  }
}

function isNumber(code) {
  return code > 47 && code < 58;
}

var eq = exports.eq = {
  context: function context(a, b) {
    return a.token === b.token && a.isExpr === b.isExpr && a.preserveSpace === b.preserveSpace;
  },
  type: function type(a, b) {
    return a && b && a.label === b.label && a.beforeExpr === b.beforeExpr && a.startsExpr === b.startsExpr && a.rightAssociative === b.rightAssociative && a.isLoop === b.isLoop && a.isAssign === b.isAssign && a.prefix === b.prefix && a.postfix === b.postfix;
  }
};
},{}],10:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/json/stringify"), __esModule: true };
},{"core-js/library/fn/json/stringify":11}],11:[function(require,module,exports){
var core  = require('../../modules/_core')
  , $JSON = core.JSON || (core.JSON = {stringify: JSON.stringify});
module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
  return $JSON.stringify.apply($JSON, arguments);
};
},{"../../modules/_core":12}],12:[function(require,module,exports){
var core = module.exports = {version: '2.1.4'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.types = exports.TokContext = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _types = require("./types");

var _whitespace = require("../util/whitespace");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = exports.TokContext = function TokContext(token, isExpr, preserveSpace, override) {
  (0, _classCallCheck3.default)(this, TokContext);

  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
};

var types = exports.types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", true),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) {
    return p.readTmplToken();
  }),
  f_expr: new TokContext("function", true)
};

// Token-specific context update code

_types.types.parenR.updateContext = _types.types.braceR.updateContext = function () {
  if (this.state.context.length === 1) {
    this.state.exprAllowed = true;
    return;
  }

  var out = this.state.context.pop();
  if (out === types.b_stat && this.curContext() === types.f_expr) {
    this.state.context.pop();
    this.state.exprAllowed = false;
  } else if (out === types.b_tmpl) {
    this.state.exprAllowed = true;
  } else {
    this.state.exprAllowed = !out.isExpr;
  }
};

_types.types.name.updateContext = function (prevType) {
  this.state.exprAllowed = false;

  if (prevType === _types.types._let || prevType === _types.types._const || prevType === _types.types._var) {
    if (_whitespace.lineBreak.test(this.input.slice(this.state.end))) {
      this.state.exprAllowed = true;
    }
  }
};

_types.types.braceL.updateContext = function (prevType) {
  this.state.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.state.exprAllowed = true;
};

_types.types.dollarBraceL.updateContext = function () {
  this.state.context.push(types.b_tmpl);
  this.state.exprAllowed = true;
};

_types.types.parenL.updateContext = function (prevType) {
  var statementParens = prevType === _types.types._if || prevType === _types.types._for || prevType === _types.types._with || prevType === _types.types._while;
  this.state.context.push(statementParens ? types.p_stat : types.p_expr);
  this.state.exprAllowed = true;
};

_types.types.incDec.updateContext = function () {
  // tokExprAllowed stays unchanged
};

_types.types._function.updateContext = function () {
  if (this.curContext() !== types.b_stat) {
    this.state.context.push(types.f_expr);
  }

  this.state.exprAllowed = false;
};

_types.types.backQuote.updateContext = function () {
  if (this.curContext() === types.q_tmpl) {
    this.state.context.pop();
  } else {
    this.state.context.push(types.q_tmpl);
  }
  this.state.exprAllowed = false;
};
},{"../util/whitespace":19,"./types":16,"babel-runtime/helpers/classCallCheck":21}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Token = undefined;

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _identifier = require("../util/identifier");

var _types = require("./types");

var _context = require("./context");

var _location = require("../util/location");

var _whitespace = require("../util/whitespace");

var _state = require("./state");

var _state2 = _interopRequireDefault(_state);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = exports.Token = function Token(state) {
  (0, _classCallCheck3.default)(this, Token);

  this.type = state.type;
  this.value = state.value;
  this.start = state.start;
  this.end = state.end;
  this.loc = new _location.SourceLocation(state.startLoc, state.endLoc);
};

// ## Tokenizer

/* eslint max-len: 0 */
/* eslint indent: 0 */

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) {
    return String.fromCharCode(code);
  } else {
    return String.fromCharCode((code - 0x10000 >> 10) + 0xD800, (code - 0x10000 & 1023) + 0xDC00);
  }
}

var Tokenizer = function () {
  function Tokenizer(options, input) {
    (0, _classCallCheck3.default)(this, Tokenizer);

    this.state = new _state2.default();
    this.state.init(options, input);
  }

  // Move to the next token

  (0, _createClass3.default)(Tokenizer, [{
    key: "next",
    value: function next() {
      if (!this.isLookahead) {
        this.state.tokens.push(new Token(this.state));
      }

      this.state.lastTokEnd = this.state.end;
      this.state.lastTokStart = this.state.start;
      this.state.lastTokEndLoc = this.state.endLoc;
      this.state.lastTokStartLoc = this.state.startLoc;
      this.nextToken();
    }

    // TODO

  }, {
    key: "eat",
    value: function eat(type) {
      if (this.match(type)) {
        this.next();
        return true;
      } else {
        return false;
      }
    }

    // TODO

  }, {
    key: "match",
    value: function match(type) {
      return this.state.type === type;
    }

    // TODO

  }, {
    key: "isKeyword",
    value: function isKeyword(word) {
      return (0, _identifier.isKeyword)(word);
    }

    // TODO

  }, {
    key: "lookahead",
    value: function lookahead() {
      var old = this.state;
      this.state = old.clone(true);

      this.isLookahead = true;
      this.next();
      this.isLookahead = false;

      var curr = this.state.clone(true);
      this.state = old;
      return curr;
    }

    // Toggle strict mode. Re-reads the next number or string to please
    // pedantic tests (`"use strict"; 010;` should fail).

  }, {
    key: "setStrict",
    value: function setStrict(strict) {
      this.state.strict = strict;
      if (!this.match(_types.types.num) && !this.match(_types.types.string)) return;
      this.state.pos = this.state.start;
      while (this.state.pos < this.state.lineStart) {
        this.state.lineStart = this.input.lastIndexOf("\n", this.state.lineStart - 2) + 1;
        --this.state.curLine;
      }
      this.nextToken();
    }
  }, {
    key: "curContext",
    value: function curContext() {
      return this.state.context[this.state.context.length - 1];
    }

    // Read a single token, updating the parser object's token-related
    // properties.

  }, {
    key: "nextToken",
    value: function nextToken() {
      var curContext = this.curContext();
      if (!curContext || !curContext.preserveSpace) this.skipSpace();

      this.state.containsOctal = false;
      this.state.octalPosition = null;
      this.state.start = this.state.pos;
      this.state.startLoc = this.state.curPosition();
      if (this.state.pos >= this.input.length) return this.finishToken(_types.types.eof);

      if (curContext.override) {
        return curContext.override(this);
      } else {
        return this.readToken(this.fullCharCodeAtPos());
      }
    }
  }, {
    key: "readToken",
    value: function readToken(code) {
      // Identifier or keyword. '\uXXXX' sequences are allowed in
      // identifiers, so '\' also dispatches to that.
      if ((0, _identifier.isIdentifierStart)(code) || code === 92 /* '\' */) {
          return this.readWord();
        } else {
        return this.getTokenFromCode(code);
      }
    }
  }, {
    key: "fullCharCodeAtPos",
    value: function fullCharCodeAtPos() {
      var code = this.input.charCodeAt(this.state.pos);
      if (code <= 0xd7ff || code >= 0xe000) return code;

      var next = this.input.charCodeAt(this.state.pos + 1);
      return (code << 10) + next - 0x35fdc00;
    }
  }, {
    key: "pushComment",
    value: function pushComment(block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? "CommentBlock" : "CommentLine",
        value: text,
        start: start,
        end: end,
        loc: new _location.SourceLocation(startLoc, endLoc)
      };

      if (!this.isLookahead) {
        this.state.tokens.push(comment);
        this.state.comments.push(comment);
      }

      this.addComment(comment);
    }
  }, {
    key: "skipBlockComment",
    value: function skipBlockComment() {
      var startLoc = this.state.curPosition();
      var start = this.state.pos,
          end = this.input.indexOf("*/", this.state.pos += 2);
      if (end === -1) this.raise(this.state.pos - 2, "Unterminated comment");

      this.state.pos = end + 2;
      _whitespace.lineBreakG.lastIndex = start;
      var match = void 0;
      while ((match = _whitespace.lineBreakG.exec(this.input)) && match.index < this.state.pos) {
        ++this.state.curLine;
        this.state.lineStart = match.index + match[0].length;
      }

      this.pushComment(true, this.input.slice(start + 2, end), start, this.state.pos, startLoc, this.state.curPosition());
    }
  }, {
    key: "skipLineComment",
    value: function skipLineComment(startSkip) {
      var start = this.state.pos;
      var startLoc = this.state.curPosition();
      var ch = this.input.charCodeAt(this.state.pos += startSkip);
      while (this.state.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
        ++this.state.pos;
        ch = this.input.charCodeAt(this.state.pos);
      }

      this.pushComment(false, this.input.slice(start + startSkip, this.state.pos), start, this.state.pos, startLoc, this.state.curPosition());
    }

    // Called at the start of the parse and after every token. Skips
    // whitespace and comments, and.

  }, {
    key: "skipSpace",
    value: function skipSpace() {
      loop: while (this.state.pos < this.input.length) {
        var ch = this.input.charCodeAt(this.state.pos);
        switch (ch) {
          case 32:case 160:
            // ' '
            ++this.state.pos;
            break;

          case 13:
            if (this.input.charCodeAt(this.state.pos + 1) === 10) {
              ++this.state.pos;
            }

          case 10:case 8232:case 8233:
            ++this.state.pos;
            ++this.state.curLine;
            this.state.lineStart = this.state.pos;
            break;

          case 47:
            // '/'
            switch (this.input.charCodeAt(this.state.pos + 1)) {
              case 42:
                // '*'
                this.skipBlockComment();
                break;

              case 47:
                this.skipLineComment(2);
                break;

              default:
                break loop;
            }
            break;

          default:
            if (ch > 8 && ch < 14 || ch >= 5760 && _whitespace.nonASCIIwhitespace.test(String.fromCharCode(ch))) {
              ++this.state.pos;
            } else {
              break loop;
            }
        }
      }
    }

    // Called at the end of every token. Sets `end`, `val`, and
    // maintains `context` and `exprAllowed`, and skips the space after
    // the token, so that the next one's `start` will point at the
    // right position.

  }, {
    key: "finishToken",
    value: function finishToken(type, val) {
      this.state.end = this.state.pos;
      this.state.endLoc = this.state.curPosition();
      var prevType = this.state.type;
      this.state.type = type;
      this.state.value = val;

      this.updateContext(prevType);
    }

    // ### Token reading

    // This is the function that is called to fetch the next token. It
    // is somewhat obscure, because it works in character codes rather
    // than characters, and because operator parsing has been inlined
    // into it.
    //
    // All in the name of speed.
    //

  }, {
    key: "readToken_dot",
    value: function readToken_dot() {
      var next = this.input.charCodeAt(this.state.pos + 1);
      if (next >= 48 && next <= 57) {
        return this.readNumber(true);
      }

      var next2 = this.input.charCodeAt(this.state.pos + 2);
      if (next === 46 && next2 === 46) {
        // 46 = dot '.'
        this.state.pos += 3;
        return this.finishToken(_types.types.ellipsis);
      } else {
        ++this.state.pos;
        return this.finishToken(_types.types.dot);
      }
    }
  }, {
    key: "readToken_slash",
    value: function readToken_slash() {
      // '/'
      if (this.state.exprAllowed) {
        ++this.state.pos;
        return this.readRegexp();
      }

      var next = this.input.charCodeAt(this.state.pos + 1);
      if (next === 61) {
        return this.finishOp(_types.types.assign, 2);
      } else {
        return this.finishOp(_types.types.slash, 1);
      }
    }
  }, {
    key: "readToken_mult_modulo",
    value: function readToken_mult_modulo(code) {
      // '%*'
      var type = code === 42 ? _types.types.star : _types.types.modulo;
      var width = 1;
      var next = this.input.charCodeAt(this.state.pos + 1);

      if (next === 42 && this.hasPlugin("exponentiationOperator")) {
        // '*'
        width++;
        next = this.input.charCodeAt(this.state.pos + 2);
        type = _types.types.exponent;
      }

      if (next === 61) {
        width++;
        type = _types.types.assign;
      }

      return this.finishOp(type, width);
    }
  }, {
    key: "readToken_pipe_amp",
    value: function readToken_pipe_amp(code) {
      // '|&'
      var next = this.input.charCodeAt(this.state.pos + 1);
      if (next === code) return this.finishOp(code === 124 ? _types.types.logicalOR : _types.types.logicalAND, 2);
      if (next === 61) return this.finishOp(_types.types.assign, 2);
      return this.finishOp(code === 124 ? _types.types.bitwiseOR : _types.types.bitwiseAND, 1);
    }
  }, {
    key: "readToken_caret",
    value: function readToken_caret() {
      // '^'
      var next = this.input.charCodeAt(this.state.pos + 1);
      if (next === 61) {
        return this.finishOp(_types.types.assign, 2);
      } else {
        return this.finishOp(_types.types.bitwiseXOR, 1);
      }
    }
  }, {
    key: "readToken_plus_min",
    value: function readToken_plus_min(code) {
      // '+-'
      var next = this.input.charCodeAt(this.state.pos + 1);

      if (next === code) {
        if (next === 45 && this.input.charCodeAt(this.state.pos + 2) === 62 && _whitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.pos))) {
          // A `-->` line comment
          this.skipLineComment(3);
          this.skipSpace();
          return this.nextToken();
        }
        return this.finishOp(_types.types.incDec, 2);
      }

      if (next === 61) {
        return this.finishOp(_types.types.assign, 2);
      } else {
        return this.finishOp(_types.types.plusMin, 1);
      }
    }
  }, {
    key: "readToken_lt_gt",
    value: function readToken_lt_gt(code) {
      // '<>'
      var next = this.input.charCodeAt(this.state.pos + 1);
      var size = 1;

      if (next === code) {
        size = code === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2;
        if (this.input.charCodeAt(this.state.pos + size) === 61) return this.finishOp(_types.types.assign, size + 1);
        return this.finishOp(_types.types.bitShift, size);
      }

      if (next === 33 && code === 60 && this.input.charCodeAt(this.state.pos + 2) === 45 && this.input.charCodeAt(this.state.pos + 3) === 45) {
        if (this.inModule) this.unexpected();
        // `<!--`, an XML-style comment that should be interpreted as a line comment
        this.skipLineComment(4);
        this.skipSpace();
        return this.nextToken();
      }

      if (next === 61) {
        // <= | >=
        size = 2;
      }

      return this.finishOp(_types.types.relational, size);
    }
  }, {
    key: "readToken_eq_excl",
    value: function readToken_eq_excl(code) {
      // '=!'
      var next = this.input.charCodeAt(this.state.pos + 1);
      if (next === 61) return this.finishOp(_types.types.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
      if (code === 61 && next === 62) {
        // '=>'
        this.state.pos += 2;
        return this.finishToken(_types.types.arrow);
      }
      return this.finishOp(code === 61 ? _types.types.eq : _types.types.prefix, 1);
    }
  }, {
    key: "getTokenFromCode",
    value: function getTokenFromCode(code) {
      switch (code) {
        // The interpretation of a dot depends on whether it is followed
        // by a digit or another two dots.
        case 46:
          // '.'
          return this.readToken_dot();

        // Punctuation tokens.
        case 40:
          ++this.state.pos;return this.finishToken(_types.types.parenL);
        case 41:
          ++this.state.pos;return this.finishToken(_types.types.parenR);
        case 59:
          ++this.state.pos;return this.finishToken(_types.types.semi);
        case 44:
          ++this.state.pos;return this.finishToken(_types.types.comma);
        case 91:
          ++this.state.pos;return this.finishToken(_types.types.bracketL);
        case 93:
          ++this.state.pos;return this.finishToken(_types.types.bracketR);
        case 123:
          ++this.state.pos;return this.finishToken(_types.types.braceL);
        case 125:
          ++this.state.pos;return this.finishToken(_types.types.braceR);

        case 58:
          if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
            return this.finishOp(_types.types.doubleColon, 2);
          } else {
            ++this.state.pos;
            return this.finishToken(_types.types.colon);
          }

        case 63:
          ++this.state.pos;return this.finishToken(_types.types.question);
        case 64:
          ++this.state.pos;return this.finishToken(_types.types.at);

        case 96:
          // '`'
          ++this.state.pos;
          return this.finishToken(_types.types.backQuote);

        case 48:
          // '0'
          var next = this.input.charCodeAt(this.state.pos + 1);
          if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
          if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
          if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
        // Anything else beginning with a digit is an integer, octal
        // number, or float.
        case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
          // 1-9
          return this.readNumber(false);

        // Quotes produce strings.
        case 34:case 39:
          // '"', "'"
          return this.readString(code);

        // Operators are parsed inline in tiny state machines. '=' (61) is
        // often referred to. `finishOp` simply skips the amount of
        // characters it is given as second argument, and returns a token
        // of the type given by its first argument.

        case 47:
          // '/'
          return this.readToken_slash();

        case 37:case 42:
          // '%*'
          return this.readToken_mult_modulo(code);

        case 124:case 38:
          // '|&'
          return this.readToken_pipe_amp(code);

        case 94:
          // '^'
          return this.readToken_caret();

        case 43:case 45:
          // '+-'
          return this.readToken_plus_min(code);

        case 60:case 62:
          // '<>'
          return this.readToken_lt_gt(code);

        case 61:case 33:
          // '=!'
          return this.readToken_eq_excl(code);

        case 126:
          // '~'
          return this.finishOp(_types.types.prefix, 1);
      }

      this.raise(this.state.pos, "Unexpected character '" + codePointToString(code) + "'");
    }
  }, {
    key: "finishOp",
    value: function finishOp(type, size) {
      var str = this.input.slice(this.state.pos, this.state.pos + size);
      this.state.pos += size;
      return this.finishToken(type, str);
    }
  }, {
    key: "readRegexp",
    value: function readRegexp() {
      var escaped = void 0,
          inClass = void 0,
          start = this.state.pos;
      for (;;) {
        if (this.state.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
        var ch = this.input.charAt(this.state.pos);
        if (_whitespace.lineBreak.test(ch)) {
          this.raise(start, "Unterminated regular expression");
        }
        if (escaped) {
          escaped = false;
        } else {
          if (ch === "[") {
            inClass = true;
          } else if (ch === "]" && inClass) {
            inClass = false;
          } else if (ch === "/" && !inClass) {
            break;
          }
          escaped = ch === "\\";
        }
        ++this.state.pos;
      }
      var content = this.input.slice(start, this.state.pos);
      ++this.state.pos;
      // Need to use `readWord1` because '\uXXXX' sequences are allowed
      // here (don't ask).
      var mods = this.readWord1();
      if (mods) {
        var validFlags = /^[gmsiyu]*$/;
        if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
      }
      return this.finishToken(_types.types.regexp, {
        pattern: content,
        flags: mods
      });
    }

    // Read an integer in the given radix. Return null if zero digits
    // were read, the integer value otherwise. When `len` is given, this
    // will return `null` unless the integer has exactly `len` digits.

  }, {
    key: "readInt",
    value: function readInt(radix, len) {
      var start = this.state.pos,
          total = 0;
      for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
        var code = this.input.charCodeAt(this.state.pos),
            val = void 0;
        if (code >= 97) {
          val = code - 97 + 10; // a
        } else if (code >= 65) {
            val = code - 65 + 10; // A
          } else if (code >= 48 && code <= 57) {
              val = code - 48; // 0-9
            } else {
                val = Infinity;
              }
        if (val >= radix) break;
        ++this.state.pos;
        total = total * radix + val;
      }
      if (this.state.pos === start || len != null && this.state.pos - start !== len) return null;

      return total;
    }
  }, {
    key: "readRadixNumber",
    value: function readRadixNumber(radix) {
      this.state.pos += 2; // 0x
      var val = this.readInt(radix);
      if (val == null) this.raise(this.state.start + 2, "Expected number in radix " + radix);
      if ((0, _identifier.isIdentifierStart)(this.fullCharCodeAtPos())) this.raise(this.state.pos, "Identifier directly after number");
      return this.finishToken(_types.types.num, val);
    }

    // Read an integer, octal integer, or floating-point number.

  }, {
    key: "readNumber",
    value: function readNumber(startsWithDot) {
      var start = this.state.pos,
          isFloat = false,
          octal = this.input.charCodeAt(this.state.pos) === 48;
      if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
      var next = this.input.charCodeAt(this.state.pos);
      if (next === 46) {
        // '.'
        ++this.state.pos;
        this.readInt(10);
        isFloat = true;
        next = this.input.charCodeAt(this.state.pos);
      }
      if (next === 69 || next === 101) {
        // 'eE'
        next = this.input.charCodeAt(++this.state.pos);
        if (next === 43 || next === 45) ++this.state.pos; // '+-'
        if (this.readInt(10) === null) this.raise(start, "Invalid number");
        isFloat = true;
      }
      if ((0, _identifier.isIdentifierStart)(this.fullCharCodeAtPos())) this.raise(this.state.pos, "Identifier directly after number");

      var str = this.input.slice(start, this.state.pos),
          val = void 0;
      if (isFloat) {
        val = parseFloat(str);
      } else if (!octal || str.length === 1) {
        val = parseInt(str, 10);
      } else if (/[89]/.test(str) || this.state.strict) {
        this.raise(start, "Invalid number");
      } else {
        val = parseInt(str, 8);
      }
      return this.finishToken(_types.types.num, val);
    }

    // Read a string value, interpreting backslash-escapes.

  }, {
    key: "readCodePoint",
    value: function readCodePoint() {
      var ch = this.input.charCodeAt(this.state.pos),
          code = void 0;

      if (ch === 123) {
        var codePos = ++this.state.pos;
        code = this.readHexChar(this.input.indexOf("}", this.state.pos) - this.state.pos);
        ++this.state.pos;
        if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds");
      } else {
        code = this.readHexChar(4);
      }
      return code;
    }
  }, {
    key: "readString",
    value: function readString(quote) {
      var out = "",
          chunkStart = ++this.state.pos;
      for (;;) {
        if (this.state.pos >= this.input.length) this.raise(this.state.start, "Unterminated string constant");
        var ch = this.input.charCodeAt(this.state.pos);
        if (ch === quote) break;
        if (ch === 92) {
          // '\'
          out += this.input.slice(chunkStart, this.state.pos);
          out += this.readEscapedChar(false);
          chunkStart = this.state.pos;
        } else {
          if ((0, _whitespace.isNewLine)(ch)) this.raise(this.state.start, "Unterminated string constant");
          ++this.state.pos;
        }
      }
      out += this.input.slice(chunkStart, this.state.pos++);
      return this.finishToken(_types.types.string, out);
    }

    // Reads template string tokens.

  }, {
    key: "readTmplToken",
    value: function readTmplToken() {
      var out = "",
          chunkStart = this.state.pos;
      for (;;) {
        if (this.state.pos >= this.input.length) this.raise(this.state.start, "Unterminated template");
        var ch = this.input.charCodeAt(this.state.pos);
        if (ch === 96 || ch === 36 && this.input.charCodeAt(this.state.pos + 1) === 123) {
          // '`', '${'
          if (this.state.pos === this.state.start && this.match(_types.types.template)) {
            if (ch === 36) {
              this.state.pos += 2;
              return this.finishToken(_types.types.dollarBraceL);
            } else {
              ++this.state.pos;
              return this.finishToken(_types.types.backQuote);
            }
          }
          out += this.input.slice(chunkStart, this.state.pos);
          return this.finishToken(_types.types.template, out);
        }
        if (ch === 92) {
          // '\'
          out += this.input.slice(chunkStart, this.state.pos);
          out += this.readEscapedChar(true);
          chunkStart = this.state.pos;
        } else if ((0, _whitespace.isNewLine)(ch)) {
          out += this.input.slice(chunkStart, this.state.pos);
          ++this.state.pos;
          switch (ch) {
            case 13:
              if (this.input.charCodeAt(this.state.pos) === 10) ++this.state.pos;
            case 10:
              out += "\n";
              break;
            default:
              out += String.fromCharCode(ch);
              break;
          }
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          chunkStart = this.state.pos;
        } else {
          ++this.state.pos;
        }
      }
    }

    // Used to read escaped characters

  }, {
    key: "readEscapedChar",
    value: function readEscapedChar(inTemplate) {
      var ch = this.input.charCodeAt(++this.state.pos);
      ++this.state.pos;
      switch (ch) {
        case 110:
          return "\n"; // 'n' -> '\n'
        case 114:
          return "\r"; // 'r' -> '\r'
        case 120:
          return String.fromCharCode(this.readHexChar(2)); // 'x'
        case 117:
          return codePointToString(this.readCodePoint()); // 'u'
        case 116:
          return "\t"; // 't' -> '\t'
        case 98:
          return "\b"; // 'b' -> '\b'
        case 118:
          return "\u000b"; // 'v' -> '\u000b'
        case 102:
          return "\f"; // 'f' -> '\f'
        case 13:
          if (this.input.charCodeAt(this.state.pos) === 10) ++this.state.pos; // '\r\n'
        case 10:
          // ' \n'
          this.state.lineStart = this.state.pos;
          ++this.state.curLine;
          return "";
        default:
          if (ch >= 48 && ch <= 55) {
            var octalStr = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/)[0];
            var octal = parseInt(octalStr, 8);
            if (octal > 255) {
              octalStr = octalStr.slice(0, -1);
              octal = parseInt(octalStr, 8);
            }
            if (octal > 0) {
              if (!this.state.containsOctal) {
                this.state.containsOctal = true;
                this.state.octalPosition = this.state.pos - 2;
              }
              if (this.state.strict || inTemplate) {
                this.raise(this.state.pos - 2, "Octal literal in strict mode");
              }
            }
            this.state.pos += octalStr.length - 1;
            return String.fromCharCode(octal);
          }
          return String.fromCharCode(ch);
      }
    }

    // Used to read character escape sequences ('\x', '\u', '\U').

  }, {
    key: "readHexChar",
    value: function readHexChar(len) {
      var codePos = this.state.pos;
      var n = this.readInt(16, len);
      if (n === null) this.raise(codePos, "Bad character escape sequence");
      return n;
    }

    // Read an identifier, and return it as a string. Sets `this.state.containsEsc`
    // to whether the word contained a '\u' escape.
    //
    // Incrementally adds only escaped chars, adding other chunks as-is
    // as a micro-optimization.

  }, {
    key: "readWord1",
    value: function readWord1() {
      this.state.containsEsc = false;
      var word = "",
          first = true,
          chunkStart = this.state.pos;
      while (this.state.pos < this.input.length) {
        var ch = this.fullCharCodeAtPos();
        if ((0, _identifier.isIdentifierChar)(ch)) {
          this.state.pos += ch <= 0xffff ? 1 : 2;
        } else if (ch === 92) {
          // "\"
          this.state.containsEsc = true;

          word += this.input.slice(chunkStart, this.state.pos);
          var escStart = this.state.pos;

          if (this.input.charCodeAt(++this.state.pos) !== 117) {
            // "u"
            this.raise(this.state.pos, "Expecting Unicode escape sequence \\uXXXX");
          }

          ++this.state.pos;
          var esc = this.readCodePoint();
          if (!(first ? _identifier.isIdentifierStart : _identifier.isIdentifierChar)(esc, true)) {
            this.raise(escStart, "Invalid Unicode escape");
          }

          word += codePointToString(esc);
          chunkStart = this.state.pos;
        } else {
          break;
        }
        first = false;
      }
      return word + this.input.slice(chunkStart, this.state.pos);
    }

    // Read an identifier or keyword token. Will check for reserved
    // words when necessary.

  }, {
    key: "readWord",
    value: function readWord() {
      var word = this.readWord1();
      var type = _types.types.name;
      if (!this.state.containsEsc && this.isKeyword(word)) {
        type = _types.keywords[word];
      }
      return this.finishToken(type, word);
    }
  }, {
    key: "braceIsBlock",
    value: function braceIsBlock(prevType) {
      if (prevType === _types.types.colon) {
        var parent = this.curContext();
        if (parent === _context.types.b_stat || parent === _context.types.b_expr) {
          return !parent.isExpr;
        }
      }

      if (prevType === _types.types._return) {
        return _whitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start));
      }

      if (prevType === _types.types._else || prevType === _types.types.semi || prevType === _types.types.eof || prevType === _types.types.parenR) {
        return true;
      }

      if (prevType === _types.types.braceL) {
        return this.curContext() === _context.types.b_stat;
      }

      return !this.state.exprAllowed;
    }
  }, {
    key: "updateContext",
    value: function updateContext(prevType) {
      var update = void 0,
          type = this.state.type;
      if (type.keyword && prevType === _types.types.dot) {
        this.state.exprAllowed = false;
      } else if (update = type.updateContext) {
        update.call(this, prevType);
      } else {
        this.state.exprAllowed = type.beforeExpr;
      }
    }
  }]);
  return Tokenizer;
}();

exports.default = Tokenizer;
},{"../util/identifier":17,"../util/location":18,"../util/whitespace":19,"./context":13,"./state":15,"./types":16,"babel-runtime/helpers/classCallCheck":21,"babel-runtime/helpers/createClass":22}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _location = require("../util/location");

var _context = require("./context");

var _types = require("./types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var State = function () {
  function State() {
    (0, _classCallCheck3.default)(this, State);
  }

  (0, _createClass3.default)(State, [{
    key: "init",
    value: function init(options, input) {
      this.strict = options.strictMode === false ? false : options.sourceType === "module";

      this.input = input;

      this.potentialArrowAt = -1;

      this.inMethod = this.inFunction = this.inGenerator = this.inAsync = false;

      this.labels = [];

      this.decorators = [];

      this.tokens = [];

      this.comments = [];

      this.trailingComments = [];
      this.leadingComments = [];
      this.commentStack = [];

      this.pos = this.lineStart = 0;
      this.curLine = 1;

      this.type = _types.types.eof;
      this.value = null;
      this.start = this.end = this.pos;
      this.startLoc = this.endLoc = this.curPosition();

      this.lastTokEndLoc = this.lastTokStartLoc = null;
      this.lastTokStart = this.lastTokEnd = this.pos;

      this.context = [_context.types.b_stat];
      this.exprAllowed = true;

      this.containsEsc = this.containsOctal = false;
      this.octalPosition = null;

      return this;
    }

    // TODO


    // TODO


    // Used to signify the start of a potential arrow function


    // Flags to track whether we are in a function, a generator.


    // Labels in scope.


    // Leading decorators.


    // Token store.


    // Comment store.


    // Comment attachment store


    // The current position of the tokenizer in the input.


    // Properties of the current token:
    // Its type


    // For tokens that include more information than their type, the value


    // Its start and end offset


    // And, if locations are used, the {line, column} object
    // corresponding to those offsets


    // Position information for the previous token


    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.


    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.


    // TODO

  }, {
    key: "curPosition",
    value: function curPosition() {
      return new _location.Position(this.curLine, this.pos - this.lineStart);
    }
  }, {
    key: "clone",
    value: function clone(skipArrays) {
      var state = new State();
      for (var key in this) {
        var val = this[key];

        if ((!skipArrays || key === "context") && Array.isArray(val)) {
          val = val.slice();
        }

        state[key] = val;
      }
      return state;
    }
  }]);
  return State;
}();

exports.default = State;
},{"../util/location":18,"./context":13,"./types":16,"babel-runtime/helpers/classCallCheck":21,"babel-runtime/helpers/createClass":22}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.keywords = exports.types = exports.TokenType = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = exports.TokenType = function TokenType(label) {
  var conf = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  (0, _classCallCheck3.default)(this, TokenType);

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.rightAssociative = !!conf.rightAssociative;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true },
    startsExpr = { startsExpr: true };

var types = exports.types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  doubleColon: new TokenType("::", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
  at: new TokenType("@"),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("prefix", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=", 6),
  relational: binop("</>", 7),
  bitShift: binop("<</>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  exponent: new TokenType("**", { beforeExpr: true, binop: 11, rightAssociative: true })
};

// Map keyword names to token types.

var keywords = exports.keywords = {};

// Succinct definitions of keyword token types
function kw(name) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  options.keyword = name;
  keywords[name] = types["_" + name] = new TokenType(name, options);
}

kw("break");
kw("case", beforeExpr);
kw("catch");
kw("continue");
kw("debugger");
kw("default", beforeExpr);
kw("do", { isLoop: true, beforeExpr: true });
kw("else", beforeExpr);
kw("finally");
kw("for", { isLoop: true });
kw("function", startsExpr);
kw("if");
kw("return", beforeExpr);
kw("switch");
kw("throw", beforeExpr);
kw("try");
kw("var");
kw("let");
kw("const");
kw("while", { isLoop: true });
kw("with");
kw("new", { beforeExpr: true, startsExpr: true });
kw("this", startsExpr);
kw("super", startsExpr);
kw("class");
kw("extends", beforeExpr);
kw("export");
kw("import");
kw("yield", { beforeExpr: true, startsExpr: true });
kw("null", startsExpr);
kw("true", startsExpr);
kw("false", startsExpr);
kw("in", { beforeExpr: true, binop: 7 });
kw("instanceof", { beforeExpr: true, binop: 7 });
kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true });
kw("void", { beforeExpr: true, prefix: true, startsExpr: true });
kw("delete", { beforeExpr: true, prefix: true, startsExpr: true });
},{"babel-runtime/helpers/classCallCheck":21}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierChar = isIdentifierChar;
/* eslint max-len: 0 */

// This is a trick taken from Esprima. It turns out that, on
// non-Chrome browsers, to check whether a string is in a set, a
// predicate containing a big ugly `switch` statement is faster than
// a regular expression, and on Chrome the two are about on par.
// This function uses `eval` (non-lexical) to produce such a
// predicate from a space-separated string of words.
//
// It starts by sorting the words by length.

function makePredicate(words) {
  words = words.split(" ");
  return function (str) {
    return words.indexOf(str) >= 0;
  };
}

// Reserved word lists for various dialects of the language

var reservedWords = exports.reservedWords = {
  6: makePredicate("enum await"),
  strict: makePredicate("implements interface let package private protected public static yield"),
  strictBind: makePredicate("eval arguments")
};

// And the keywords

var isKeyword = exports.isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this let const class extends export import yield super");

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `tools/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠ-ࢲऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛸᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕ℘-ℝℤΩℨK-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〇〡-〩〱-〵〸-〼ぁ-ゖ゛-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞭꞰꞱꟷ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭟꭤꭥꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
var nonASCIIidentifierChars = "‌‍·̀-ͯ·҃-֑҇-ׇֽֿׁׂׅׄؐ-ًؚ-٩ٰۖ-ۜ۟-۪ۤۧۨ-ۭ۰-۹ܑܰ-݊ަ-ް߀-߉߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࣤ-ःऺ-़ा-ॏ॑-ॗॢॣ०-९ঁ-ঃ়া-ৄেৈো-্ৗৢৣ০-৯ਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣ૦-૯ଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఀ-ఃా-ౄె-ైొ-్ౕౖౢౣ౦-౯ಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣ೦-೯ഁ-ഃാ-ൄെ-ൈൊ-്ൗൢൣ൦-൯ංඃ්ා-ුූෘ-ෟ෦-෯ෲෳัิ-ฺ็-๎๐-๙ັິ-ູົຼ່-ໍ໐-໙༘༙༠-༩༹༵༷༾༿ཱ-྄྆྇ྍ-ྗྙ-ྼ࿆ါ-ှ၀-၉ၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟፩-፱ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳ឴-៓៝០-៩᠋-᠍᠐-᠙ᢩᤠ-ᤫᤰ-᤻᥆-᥏ᦰ-ᧀᧈᧉ᧐-᧚ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼-᪉᪐-᪙᪰-᪽ᬀ-ᬄ᬴-᭄᭐-᭙᭫-᭳ᮀ-ᮂᮡ-ᮭ᮰-᮹᯦-᯳ᰤ-᰷᱀-᱉᱐-᱙᳐-᳔᳒-᳨᳭ᳲ-᳴᳸᳹᷀-᷵᷼-᷿‿⁀⁔⃐-⃥⃜⃡-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙゚〯꘠-꘩꙯ꙴ-꙽ꚟ꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣐-꣙꣠-꣱꤀-꤉ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀꧐-꧙ꧥ꧰-꧹ꨩ-ꨶꩃꩌꩍ꩐-꩙ꩻ-ꩽꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꫫ-ꫯꫵ꫶ꯣ-ꯪ꯬꯭꯰-꯹ﬞ︀-️︠-︭︳︴﹍-﹏０-９＿";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by tools/generate-identifier-regex.js
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 99, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 98, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 955, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 38, 17, 2, 24, 133, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 32, 4, 287, 47, 21, 1, 2, 0, 185, 46, 82, 47, 21, 0, 60, 42, 502, 63, 32, 0, 449, 56, 1288, 920, 104, 110, 2962, 1070, 13266, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 16481, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 1340, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 16355, 541];
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 16, 9, 83, 11, 168, 11, 6, 9, 8, 2, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 316, 19, 13, 9, 214, 6, 3, 8, 112, 16, 16, 9, 82, 12, 9, 9, 535, 9, 20855, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 4305, 6, 792618, 239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) return false;

    pos += set[i + 1];
    if (pos >= code) return true;
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  return isInAstralSet(code, astralIdentifierStartCodes);
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SourceLocation = exports.Position = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

exports.getLineInfo = getLineInfo;

var _whitespace = require("./whitespace");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = exports.Position = function Position(line, col) {
  (0, _classCallCheck3.default)(this, Position);

  this.line = line;
  this.column = col;
};

var SourceLocation = exports.SourceLocation = function SourceLocation(start, end) {
  (0, _classCallCheck3.default)(this, SourceLocation);

  this.start = start;
  this.end = end;
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    _whitespace.lineBreakG.lastIndex = cur;
    var match = _whitespace.lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  }
}
},{"./whitespace":19,"babel-runtime/helpers/classCallCheck":21}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNewLine = isNewLine;
// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = exports.lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = exports.lineBreakG = new RegExp(lineBreak.source, "g");

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
}

var nonASCIIwhitespace = exports.nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
},{}],20:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":23}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
},{}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
},{"babel-runtime/core-js/object/define-property":20}],23:[function(require,module,exports){
require('../../modules/es6.object.define-property');
var $Object = require('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};
},{"../../modules/_core":26,"../../modules/es6.object.define-property":39}],24:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],25:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":35}],26:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],27:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":24}],28:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":31}],29:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":32,"./_is-object":35}],30:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , ctx       = require('./_ctx')
  , hide      = require('./_hide')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":26,"./_ctx":27,"./_global":32,"./_hide":33}],31:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],32:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],33:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":28,"./_object-dp":36,"./_property-desc":37}],34:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":28,"./_dom-create":29,"./_fails":31}],35:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],36:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":25,"./_descriptors":28,"./_ie8-dom-define":34,"./_to-primitive":38}],37:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],38:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":35}],39:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperty: require('./_object-dp').f});
},{"./_descriptors":28,"./_export":30,"./_object-dp":36}]},{},[4])(4)
});