import { TokContext, types as tc } from "../../tokenizer/context";
import Parser from "../../parser";

tc.cssx = new TokContext("cssx");
tc.cssxDefinition = new TokContext("cssxDefinition");
tc.cssxSelector = new TokContext("cssxSelector");
tc.cssxRules = new TokContext("cssxRules");
tc.cssxProperty = new TokContext("cssxProperty");
tc.cssxValue = new TokContext("cssxValue");
tc.cssxMediaQuery = new TokContext("CSSXMediaQuery");
tc.cssxKeyframes = new TokContext("CSSXKeyframes");

const pp = Parser.prototype;

const registerInOut = function (name, context) {
  pp["cssx" + name + "In"] = function () {
    const curContext = this.curContext();

    if (curContext === context) return;
    this.state.context.push(context);
  };

  pp["cssx" + name + "Out"] = function () {
    const curContext = this.curContext();

    if (curContext !== context) {
      this.raise(this.state.start, "CSSX: Not in " + context.token + " context");
    }
    this.state.context.length -= 1;
  };
};

registerInOut("", tc.cssx);
registerInOut("MediaQuery", tc.cssxMediaQuery);
registerInOut("Keyframes", tc.cssxKeyframes);
registerInOut("Definition", tc.cssxDefinition);