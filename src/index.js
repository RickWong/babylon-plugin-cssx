import { TokenType, types as tt } from '../../babylon/lib/tokenizer/types';
import { TokContext, types as tc } from '../../babylon/lib/tokenizer/context';
import { Token } from '../../babylon/lib/tokenizer';
import { isIdentifierChar, isIdentifierStart } from '../../babylon/lib/util/identifier';
import { eq } from './utilities';

var Babylon = {
  tt, tc, TokContext, Token, TokenType, isIdentifierChar, isIdentifierStart
};

import context from './context';
import expressions from './expressions';
import helpers from './helpers';
import parsers from './parsers';
import readers from './readers';
import types from './types';

export default function CSSX(Parser) {
  return {
    pluginName: 'cssx',
    pluginFunc: function CSSX(instance) {

      var pp = Babylon.pp = Parser.prototype;

      // replacing <style> tags with cssx calls
      instance.input = instance.input
        .replace(/<style>/g, 'cssx(')
        .replace(/<\/style>/g, ')');

      context(Babylon);
      expressions(Babylon);
      helpers(Babylon);
      parsers(Babylon);
      readers(Babylon);
      types(Babylon);

      instance.extend('parseStatement', function (inner) {
        return function (declaration, topLevel) {
          if (this.cssxMatchPreviousToken(tt.cssxStart) && !eq.context(this.curContext(), tc.cssxDefinition)) {
            this.cssxDefinitionIn();
            return this.cssxParse();
          } else if (this.match(tt.cssxSelector)) {
            return this.cssxParseElement();
          }
          return inner.call(this, declaration, topLevel);
        };
      });

      instance.extend('parseBlock', function (inner) {
        return function (allowDirectives) {
          let fallback = () => inner.call(this, allowDirectives);
          let context = this.curContext(), blockStmtNode;
          let rules = [], nested = [], lastToken;

          if (eq.context(context, tc.cssxRules) && this.match(tt.cssxRulesStart)) {

            blockStmtNode = this.startNode();
            // no rules
            if (this.match(tt.cssxRulesStart) && eq.type(this.lookahead().type, tt.braceR)) {
              this.next();
            } else {
              // reading the style
              while (!this.match(tt.cssxRulesEnd) && !this.match(tt.eof)) {
                if (this.cssxIsNestedElement()) {
                  nested.push(this.cssxParseNestedElement());
                } else {
                  rules.push(this.cssxParseRule(this.cssxReadProperty(), this.cssxReadValue()));
                }
              }
              if (this.state.pos >= this.input.length) this.finishToken(tt.eof);
            }
            blockStmtNode.body = rules;
            if (nested.length > 0) {
              blockStmtNode.nested = nested;
            }
            lastToken = this.cssxGetPreviousToken();
            return this.finishNodeAt(
              blockStmtNode, 'CSSXRules', lastToken.end, lastToken.loc.end
            );
          }

          return fallback();
        };
      });

      instance.extend('readToken', function (inner) {
        return function (code) {

          let fallback = () => inner.call(this, code);
          let context = this.curContext();

          if (this.isLookahead) return fallback();

          if (this.match(tt.cssxSelector) && this.cssxMatchNextToken(tt.braceL)) {
            ++this.state.pos;
            return this.finishToken(tt.cssxRulesStart);
          } else if (this.match(tt.cssxSelector) && this.cssxMatchNextToken(tt.parenR)) {
            this.finishToken(tt.cssxRulesEnd);
            return;
          } else if (this.match(tt.cssxRulesStart)) {
            // no styles
            if (this.cssxMatchNextToken(tt.braceR)) {
              return this.cssxStoreNextCharAsToken(tt.cssxRulesEnd);
            } else {
              return this.finishToken(tt.cssxRulesStart);
            }
          // matching the : between the property and the value
          } else if (this.match(tt.cssxProperty) && code === 58) { // 58 = :        
            return this.cssxStoreNextCharAsToken(tt.colon);
          // matching the semicolon at the end of the rule
          } else if (this.match(tt.cssxValue) && code === 59) { // 59 = ;
            this.cssxStoreNextCharAsToken(tt.semi);
            // eding with semicolon
            if (this.cssxMatchNextToken(tt.braceR)) {
              this.cssxStoreNextCharAsToken(tt.cssxRulesEnd);
            }
            return;
          } else if (this.match(tt.cssxValue) && this.cssxMatchNextToken(tt.braceR)) {
            // ending without semicolon
            return this.cssxStoreNextCharAsToken(tt.cssxRulesEnd);
          } else if (this.match(tt.cssxRulesEnd) && this.cssxMatchNextToken(tt.parenR)) {
            ++this.state.pos;
            this.finishToken(tt.cssxEnd);
            return;
          } else if (this.match(tt.cssxRulesEnd) && eq.context(context, tc.cssxNested)) {
            return;
          }

          // cssx entry point
          if (this.cssxEntryPoint()) {
            return;
          }

          // looping through the cssx elements
          if (eq.context(context, tc.cssxDefinition) || eq.context(context, tc.cssxNested)) {
            this.skipSpace();
            return this.cssxReadSelector();
          }

          return fallback();  
        };
      });

      instance.extend('getTokenFromCode', function (inner) {
        return function (code) {
          let fallback = () => inner.call(this, code);

          // when the selector starts with #
          if (code === 35 && (
            this.match(tt.cssxStart) ||
            this.match(tt.cssxRulesEnd)
          )) {
            ++this.state.pos;
            return this.finishToken(tt.string, '#');
          }

          return fallback();
        };
      });

      instance.extend('parseExprAtom', function(inner) {
        return function(refShortHandDefaultPos) {
          if (this.match(tt.cssxStart)) {
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
        let nextToken = this.lookahead();
        let parenL, future, cState, firstInCSSX;

        if (
          eq.type(nextToken.type, tt.name) &&
          nextToken.value === 'cssx' &&
          this.cssxMatchNextToken(tt.name, tt.parenL)
        ) {
          cState = this.state.clone();
          future = this.cssxLookahead(3);
          parenL = future.stack[1];
          firstInCSSX = future.stack[2];

          // Making sure that we don't parse
          // cssx('something') or cssx('something')
          if (eq.type(firstInCSSX.type, tt.string)) {
            return false;
          }

          this.cssxIn();
          this.state.pos = parenL.end;
          this.finishToken(tt.cssxStart);
          this.cssxSyncEndTokenStateToCurPos();
          if (this.cssxMatchNextToken(tt.parenR)) {
            this.state =cState;
            return false;
          }
          this.cssxStoreCurrentToken();
          return true;
        }
        return false;
      };

      pp.cssxRulesEntryPoint = function () {
        return (
          (this.match(tt.braceL) && this.cssxMatchNextToken(tt.name, tt.colon))
        );
      };

    }
  }
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
