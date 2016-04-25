var path = require('path');
var fs = require('fs');
var glob = require("glob");
var chai = require('chai');
var expect = chai.expect;
var d = describe;

var babylon = require('../../babylon/lib/');
// var babylon = require('babylon');

// var cssxPlugin = require('../bin/plugin');
var cssxPlugin = require('../lib');

var parse = function (code, opts) {
  if (!opts) opts = {};
  return JSON.stringify(babylon.parse(code, {
    plugins: [
      cssxPlugin,
      'jsx',
      'flow',
      'asyncFunctions',
      'classConstructorCall',
      'doExpressions',
      'trailingFunctionCommas',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'exponentiationOperator',
      'asyncGenerators',
      'functionBind',
      'functionSent'
    ],
    sourceType: opts.sourceType || 'script'
  }), null, 2);
};


var tests = [];
// var only = 'nested/49'.split(',');

glob.sync(__dirname + '/cssx/**/actual.js').forEach(function (actual) {
  var testDir = path.dirname(actual), testDirParts = testDir.split('/');
  var testName = testDirParts[testDirParts.length-2] + '/' + testDirParts[testDirParts.length-1];
  var includeTest = false;

  if (typeof only !== 'undefined') {
    if (only.length > 0 && (only.indexOf(testName) >= 0 || only === 'all')) {
      includeTest = true;
    }
  } else {
    includeTest = true;
  }

  if (includeTest) {
    tests.push({
      name: testName,
      actual: actual,
      expected: testDir + '/expected.json',
      testDir: testDir
    });
  }
});

if (typeof only !== 'undefined') d = describe.only;

d('Given the babylon plugin', function () {
  tests.forEach(function (test) {
    describe('when running ' + test.name, function () {
      it('should pass actual JavaScript and receive expected json', function () {
        var result;
        var resultFile = test.testDir + '/expected.result.json';

        if (test.testDir.indexOf('errors/') >= 0) {
          try {
            result = parse(file(test.actual));
          } catch(err) {
            expect(err.message).to.be.equal(require(test.testDir + '/options.json').throws);
          }
        } else {
          result = parse(file(test.actual));
          fs.writeFileSync(resultFile, result);
          expect(result).to.be.equal(file(test.expected));
          fs.unlinkSync(resultFile);
        }
      });
    });
  });
});

function file (f) {
  return fs.readFileSync(f, 'utf8')
};
function json (f) {
  return JSON.stringify(CSSXTranspiler.ast(file(f)), null, 2)
};