export default function (Babylon) {

  var { pp, tt } = Babylon;

  pp.cssxParse = function () {
    let lastToken = this.cssxGetPreviousToken();
    let definition = this.startNodeAt(lastToken.start, lastToken.loc.start);

    this.skipSpace();
    this.cssxReadSelector();
    this.parseBlockBody(definition, true, false, tt.cssxEnd);
    this.finishNode(definition, "CSSXDefinition");
    return definition;
  };

  pp.cssxParseExpression = function () {
    let exprNode, lastToken, result;

    lastToken = this.cssxGetPreviousToken();
    exprNode = this.startNodeAt(lastToken.start, lastToken.loc.start);
    exprNode.body = [];

    while (this.match(tt.cssxSelector)) {
      exprNode.body.push(this.cssxParseElement());
    }

    result = this.finishNodeAt(exprNode, "CSSXExpression", this.state.end, this.state.endLoc);
    this.next();
    return result;
  };

  pp.cssxParseElement = function() {
    let elementNode, selectorNode, result, lastToken;

    elementNode = this.startNodeAt(this.state.start, this.state.startLoc);
    selectorNode = this.startNodeAt(this.state.start, this.state.startLoc);

    selectorNode.value = this.state.value;
    this.cssxExpressionSet(selectorNode);
    elementNode.selector = this.finishNodeAt(
      selectorNode, "CSSXSelector", this.state.end, this.state.endLoc
    );
    this.next();
    if (!this.match(tt.cssxRulesEnd)) {
      elementNode.body = this.parseBlock();
    }
    lastToken = this.cssxGetPreviousToken();
    result = this.finishNodeAt(elementNode, "CSSXElement", lastToken.end, lastToken.loc.end);

    this.nextToken();
    return result;
  };

  pp.cssxParseNestedElement = function () {
    return this.cssxParseNestedSelectors({
      name: "CSSXNestedElement",
      context: {
        in: () => this.cssxNestedIn()
      },
      tokens: {
        el: tt.cssxNested,
        start: tt.cssxNestedStart,
        end: tt.cssxNestedEnd
      },
      errors: {
        unclosed: "CSSX: unclosed nested block",
        expectSelector: "CSSX: expected selector as a start of the nested block"
      }
    });
  }

  pp.cssxParseNestedSelectors = function (options) {
    let result;

    if (this.match(tt.cssxRulesStart)) this.next();

    options.context.in();
    this.cssxFinishTokenAt(options.tokens.start, this.state.value, this.state.end, this.state.endLoc);

    if (this.cssxMatchNextToken(tt.braceR)) { // empty nested element
      this.cssxStoreCurrentToken();
      this.skipSpace();
      this.cssxSyncLocPropsToCurPos();
    } else {
      this.next();
      if (this.match(tt.cssxSelector)) {
        result = this.cssxParseElement();
      } else {
        this.raise(this.state.pos, options.errors.expectSelector);
      }
    }

    this.finishToken(options.tokens.end);
    this.cssxStoreCurrentToken();
    if (this.cssxMatchNextToken(tt.braceR)) {
      this.cssxStoreNextCharAsToken(tt.cssxRulesEnd);
    }

    return result;
  };

  pp.cssxParseRule = function (propertyNode, valueNode) {
    let node = this.startNodeAt(propertyNode.start, propertyNode.loc.start);
    let pos = valueNode.end;
    let locEnd = this.cssxClonePosition(valueNode.loc.end);

    if (this.match(tt.semi) || (this.match(tt.cssxRulesEnd) && this.cssxMatchPreviousToken(tt.semi, 1))) {
      ++locEnd.column;
      ++pos;
    }

    node.label = propertyNode;
    node.body = valueNode;

    return this.finishNodeAt(node, "CSSXRule", pos, locEnd);
  };

  pp.cssxParseRuleChild = function (type, value, pos, loc) {
    let node = this.startNodeAt(pos, loc);

    this.cssxExpressionSet(node);
    node.name = value;
    return this.finishNodeAt(node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
  };

}
