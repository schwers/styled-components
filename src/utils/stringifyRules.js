// @flow
import Stylis from 'stylis'
// $FlowFixMe
import _insertRulePlugin from 'stylis-rule-sheet'
import type { Interpolation } from '../types'

const stylis = new Stylis({
  global: false,
  cascade: true,
  keyframe: false,
  prefix: true,
  compress: false,
  semicolon: true,
})

// Wrap `insertRulePlugin to build a list of rules,
// and then make our own plugin to return the rules. This
// makes it easier to hook into the existing SSR architecture

let parsingRules = []
// eslint-disable-next-line consistent-return
const returnRulesPlugin = context => {
  switch (context) {
    case -2: {
      const parsedRules = parsingRules
      parsingRules = []
      return parsedRules
    }
    default:
      break
  }
}

const parseRulesPlugin = _insertRulePlugin(rule => {
  parsingRules.push(rule)
})

stylis.use([parseRulesPlugin, returnRulesPlugin])

const stringifyRules = (
  rules: Array<Interpolation>,
  selector: ?string,
  prefix: ?string,
): Array<string> => {
  const flatCSS = rules
    .join('')
    .replace(/^\s*\/\/.*$/gm, '') // replace JS comments

  const cssStr = (selector && prefix) ?
    `${prefix} ${selector} { ${flatCSS} }` :
    flatCSS

  return [stylis(prefix || !selector ? '' : selector, cssStr)]
}

export default stringifyRules
