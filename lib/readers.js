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
        word = void 0,
        next = void 0;

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
    next = this.lookahead();

    if (!_utilities.eq.type(next.type, tt.colon)) {
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