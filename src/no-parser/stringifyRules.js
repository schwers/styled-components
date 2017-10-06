// @flow
import type { Interpolation, Stringifier } from '../types'

const stringifyRules: Stringifier = (
  rules: Array<Interpolation>,
  selector: ?string,
  prefix: ?string,
): Array<string> => (
    rules
    .reduce((accRules: Array<string>, partial: Interpolation, index: number): Array<string> => {
      accRules.push(
        // NOTE: This is to not prefix keyframes with the animation name
        ((index > 0 || !prefix) && selector ? selector : '') +
        (
          (partial && Array.isArray(partial)) ?
            partial.join('') :
            partial.toString()
        ))

      return accRules
    }, [])
)

export default stringifyRules
