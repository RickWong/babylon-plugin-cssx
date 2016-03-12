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