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

let queue = []

// Credit to Emotion for the original implementation. Slightly modified version
// to return rules as an array in order to easily fit into this dual
// clientside & serverside architecture
// https://github.com/emotion-js/emotion/blob/bc85789f9b21a9a7a51ec70bc4b1217af3f2d90b/packages/emotion/src/index.js#L42-L104
// https://github.com/emotion-js/emotion
function insertionPlugin(
  context,
  content,
  selectors,
  parent,
  line,
  column,
  length,
  id
) {
  switch (context) {
    case -2: {
      const retQueue = queue
      queue = []
      console.log(retQueue)
      return retQueue
    }

    case 2: {
      if (id === 0) {
        const joinedSelectors = selectors.join(',')
        const rule = `${joinedSelectors}{${content}}`
        if (parent.join(',') === joinedSelectors || parent[0] === '') {
          queue.push(rule)
        } else {
          queue.unshift(rule)
        }
      }
      break
    }
    // after an at rule block
    case 3: {
      let chars = selectors.join('')
      const second = chars.charCodeAt(1)
      let child = content
      switch (second) {
        // s upports
        case 115:
        // d ocument
        // eslint-disable-next-line no-fallthrough
        case 100:
        // m edia
        // eslint-disable-next-line no-fallthrough
        case 109: {
          queue.push(`${chars}{${child}}`)
          break
        }
        // k eyframes
        case 107: {
          chars = chars.substring(1)
          child = `${chars}{${child}}`
          queue.push(`@-webkit-${child}`)
          queue.push(`@${child}`)
          break
        }
        default: {
          queue.push(chars + child)
        }
      }
    }
  }
}

stylis.use(insertionPlugin)

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

  return stylis(prefix || !selector ? '' : selector, cssStr)
}

export default stringifyRules
