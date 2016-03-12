"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CSSXSelectorAllowedCodes = exports.CSSXValueAllowedCodes = exports.CSSXPropertyAllowedCodes = undefined;

var _utilities = require("./utilities");

var CSSXPropertyAllowedCodes = exports.CSSXPropertyAllowedCodes = ["-"].map(_utilities.stringToCode);

var CSSXValueAllowedCodes = exports.CSSXValueAllowedCodes = [" ", "\n", "\t", "#", ".", "-", "(", ")", "[", "]", "'", "\"", "%", ",", ":", "/", "\\", "!", "?"].map(_utilities.stringToCode);

var CSSXSelectorAllowedCodes = exports.CSSXSelectorAllowedCodes = [" ", "*", ">", "+", "~", ".", ":", "=", "[", "]", "\"", "-", "!", "?", "@", "#", "$", "%", "^", "&", "'", "|", ",", "\n"].map(_utilities.stringToCode);