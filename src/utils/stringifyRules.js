// @flow
import Stylis from 'stylis'
import type { Interpolation } from '../types'

const stylis = new Stylis({
  global: false,
  cascade: true,
  keyframe: false,
  prefix: true,
  compress: false,
  semicolon: true,
})

const isBrowser = typeof window !== 'undefined'

let pendingContexts = []
if (isBrowser) {
  stylis.use((context, content, selectors, parent, line, column, length) => {
    pendingContexts.push({ context, content, selectors, parent, line, column, length });
  })
}

const stringifyRules = (
  rules: Array<Interpolation>,
  selector: ?string,
  prefix: ?string,
): string => {
  const flatCSS = rules
    .join('')
    .replace(/^\s*\/\/.*$/gm, '') // replace JS comments

  const cssStr = (selector && prefix) ?
    `${prefix} ${selector} { ${flatCSS} }` :
    flatCSS

  const styles = stylis(prefix || !selector ? '' : selector, cssStr)
  if (isBrowser) {
    console.log('')
    console.log('css string', prefix || !selector ? '' : selector, cssStr)
    console.log('parsed styles', styles)
    console.log('contexts', pendingContexts)
    pendingContexts = []
  }

  return styles
}

export default stringifyRules
