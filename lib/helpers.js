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

    if (previous && previous.type === type) return true;
    return false;
  };

  pp.cssxMatchNextToken = function () {
    var next = void 0,
        nextA = void 0,
        nextB = void 0,
        old = void 0;

    if (arguments.length === 1) {
      next = this.lookahead();
      if (next && next.type === arguments[0]) return true;
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
      if (nextA && nextA.type === arguments[0] && nextB && nextB.type === arguments[1]) {
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