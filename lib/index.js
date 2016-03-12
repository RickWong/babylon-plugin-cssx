'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CSSX;

var _types = require('../../babylon/lib/tokenizer/types');

var _context = require('../../babylon/lib/tokenizer/context');

var _tokenizer = require('../../babylon/lib/tokenizer');

var _identifier = require('../../babylon/lib/util/identifier');

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
          if (this.cssxMatchPreviousToken(_types.types.cssxStart) && this.curContext() !== _context.types.cssxDefinition) {
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

          if (context === _context.types.cssxRules && this.match(_types.types.cssxRulesStart)) {

            blockStmtNode = this.startNode();
            // no rules
            if (this.match(_types.types.cssxRulesStart) && this.lookahead().type === _types.types.braceR) {
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
              } else if (this.match(_types.types.cssxRulesEnd) && context === _context.types.cssxMediaQuery || this.match(_types.types.cssxRulesEnd) && context === _context.types.cssxKeyframes) {
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
          if (context === _context.types.cssxDefinition || context === _context.types.cssxMediaQuery || context === _context.types.cssxKeyframes) {
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

        if (nextToken.type === _types.types.name && nextToken.value === 'cssx' && this.cssxMatchNextToken(_types.types.name, _types.types.parenL)) {
          cState = this.state.clone();
          future = this.cssxLookahead(3);
          parenL = future.stack[1];
          firstInCSSX = future.stack[2];

          // Making sure that we don't parse
          // cssx('something') or cssx('something')
          if (firstInCSSX.type === _types.types.string) {
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