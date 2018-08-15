// @flow
import Stylis from 'stylis'
import _insertRulePlugin from 'stylis-rule-sheet'
import type { Interpolation } from '../types'

// Note: There seems to be a memory leak in long-running stylis instances.
// read: in server-rendered situations.
// Prevent this from causing server-issues by allocating a new stylis object per
const getStylisInstance = () => {
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
    if (context === -2) {
      const parsedRules = parsingRules
      parsingRules = []
      return parsedRules
    }
  }

  const parseRulesPlugin = _insertRulePlugin(rule => {
    parsingRules.push(rule)
  })

  stylis.use([parseRulesPlugin, returnRulesPlugin])

  return stylis
}

const stringifyRules = (
  rules: Array<Interpolation>,
  selector: ?string,
  prefix: ?string
): Array<string> => {
  const flatCSS = rules.join('').replace(/^\s*\/\/.*$/gm, '') // replace JS comments

  const cssStr =
    selector && prefix ? `${prefix} ${selector} { ${flatCSS} }` : flatCSS

  return getStylisInstance()(prefix || !selector ? '' : selector, cssStr)
}

export default stringifyRules
