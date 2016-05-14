import { stringToCode } from "./utilities";

export const CSSXPropertyAllowedCodes = [
  "-"
].map(stringToCode);

export const CSSXValueAllowedCodes = [
  " ", "\n", "\t", "#", ".", "-", "(", ")", "[", "]", "'", "\"", "%", ",", ":", "/", "\\", "!", "?", "+"
].map(stringToCode);

export const CSSXSelectorAllowedCodes = [
  " ", "*", ">", "+", "~", ".", ":", "=", "[", "]", "\"", "-",
  "!", "?", "@", "#", "$", "%", "^", "&", "'", "|", ",", "\n"
].map(stringToCode);