'use strict';

exports.__esModule = true;
exports.objToCss = undefined;

var _hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');

var _hyphenateStyleName2 = _interopRequireDefault(_hyphenateStyleName);

var _isPlainObject = require('is-plain-object');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var babelPluginFlowReactPropTypes_proptype_Interpolation = require('../types').babelPluginFlowReactPropTypes_proptype_Interpolation || require('prop-types').any;

var objToCss = exports.objToCss = function objToCss(obj, prevKey) {
  var css = '';

  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (var key in obj) {
    var chunk = obj[key];
    if (chunk !== undefined && chunk !== null && chunk !== false && chunk !== '') {
      var cssChunk = (0, _isPlainObject2.default)(chunk) ? objToCss(chunk, key) : (0, _hyphenateStyleName2.default)(key) + ': ' + chunk + ';';

      if (cssChunk.length > 0) {
        if (css.length > 0) {
          css += ' ';
        }

        css += cssChunk;
      }
    }
  }

  return prevKey ? prevKey + ' {\n  ' + css + '\n}' : css;
};

var innerFlatten = function innerFlatten(targetChunks, chunk, executionContext) {
  // State-machine for updating rules. We should put typeof checks directly
  // in the conditional and heavily rely on usage of if/else-if/else to
  // better work with V8's branch prediction
  // https://jsperf.com/typeof-perf-caching
  if (chunk === undefined || chunk === null || chunk === false || chunk === '') {
    // Nothing to do
  } else if (typeof chunk === 'string') {
    targetChunks.push(chunk);
  } else if (typeof chunk === 'number') {
    targetChunks.push(chunk.toString());
  } else if (Array.isArray(chunk)) {
    for (var i = 0; i < chunk.length; i += 1) {
      innerFlatten(targetChunks, chunk[i], executionContext);
    }
  } else if (chunk.hasOwnProperty('styledComponentId')) {
    targetChunks.push('.' + chunk.styledComponentId);
  } else if (typeof chunk === 'function') {
    if (executionContext) {
      innerFlatten(targetChunks, chunk(executionContext), executionContext);
    } else {
      // defer the execution context, e.g. `css` styles
      targetChunks.push(chunk);
    }
  } else if ((0, _isPlainObject2.default)(chunk)) {
    targetChunks.push(objToCss(chunk));
  } else {
    // all else fails, just add it, and to string it
    targetChunks.push(chunk.toString());
    /* flow-enabled */
  }
};

var flatten = function flatten(chunks, executionContext) {
  var resultChunks = [];
  for (var i = 0; i < chunks.length; i += 1) {
    innerFlatten(resultChunks, chunks[i], executionContext);
  }

  return resultChunks;
};

exports.default = flatten;