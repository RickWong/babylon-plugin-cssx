export function stringToCode (ch) {
  return String(ch).charCodeAt(0);
}

export function posToLoc (pos, input, verbose) {
  let line=1, loopPos=0, linePos = 0, lineStart = 0;

  while (loopPos < input.length && loopPos !== pos) {
    if (input.charAt(loopPos) === "\n") {
      linePos = 0;
      lineStart = loopPos+1;
      ++line;
    } else {
      ++linePos;
    }
    ++loopPos;
  }
  if (!verbose) {
    return { line, column: linePos };
  } else {
    return {
      line,
      curLine: line,
      column: linePos,
      lineStart
    };
  }
}

export function isNumber(code) {
  return code > 47 && code < 58;
}

export var eq = {
  context(a, b) {
    return a.token === b.token && a.isExpr === b.isExpr && a.preserveSpace === b.preserveSpace;
  },
  type (a, b) {
    return a && b && a.label === b.label &&
      a.beforeExpr === b.beforeExpr &&
      a.startsExpr === b.startsExpr &&
      a.rightAssociative === b.rightAssociative &&
      a.isLoop === b.isLoop &&
      a.isAssign === b.isAssign &&
      a.prefix === b.prefix &&
      a.postfix === b.postfix;
  }
}