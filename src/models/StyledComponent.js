// @flow

import { Component, createElement } from 'react'
import PropTypes from 'prop-types'

import type { Theme } from './ThemeProvider'
import createWarnTooManyClasses from '../utils/createWarnTooManyClasses'

import isTag from '../utils/isTag'
import validAttr, { isReactFunction } from '../utils/validAttr'
import isStyledComponent from '../utils/isStyledComponent'
import getComponentName from '../utils/getComponentName'
import determineTheme from '../utils/determineTheme'
import escape from '../utils/escape'
import type { RuleSet, Target } from '../types'

import { CHANNEL_NEXT, CONTEXT_CHANNEL_SHAPE } from './ThemeProvider'
import StyleSheet, { CONTEXT_KEY } from './StyleSheet'
import ServerStyleSheet from './ServerStyleSheet'

// HACK for generating all static styles without needing to allocate
// an empty execution context every single time...
const STATIC_EXECUTION_CONTEXT = {}

// When doing cross-instance dymaic style caching, can we ignore this
// property based on its name?
// If its a react event handler, or a few specific props, we can!
// NOTE: this breaks if you rely on react event handlers presecence
// for styling. This is not a good practice imo, but I would like to
// add an escape hatch for this.
const canIgnoreDynamicProp = (propName: string): boolean =>
  isReactFunction(propName) || // ignore react event handlers
  propName === 'children' || // ignore children props in favor of explicit props on the component
  propName === 'className' || // passed in classnames from the parent should not matter
  propName === 'innerRef' || // ref and inner ref are outside of scope for styling
  propName === 'ref' ||
  propName === 'theme' || // we compare themes based on the `determined` theme
  propName === 'style' // style overrides should not affect css styles

// count the number of dynamic properties that are comparable
// when doing 'umbrella' caching of style generation across
// dynamic instances
const numComparableDynamicProps = (props: any) => {
  let numProps = 0
  // eslint-disable-next-line no-restricted-syntax
  for (const propName in props) {
    if (canIgnoreDynamicProp(propName)) {
      // eslint-disable-next-line no-continue
      continue
    } else {
      numProps += 1
    }
  }

  return numProps
}

export default (ComponentStyle: Function, constructWithOptions: Function) => {
  const identifiers = {}

  /* We depend on components having unique IDs */
  const generateId = (_displayName: string, parentComponentId: string) => {
    const displayName =
      typeof _displayName !== 'string' ? 'sc' : escape(_displayName)

    let componentId

    /**
     * only fall back to hashing the component injection order if
     * a proper displayName isn't provided by the babel plugin
     */
    if (!_displayName) {
      const nr = (identifiers[displayName] || 0) + 1
      identifiers[displayName] = nr

      componentId = `${displayName}-${ComponentStyle.generateName(
        displayName + nr
      )}`
    } else {
      componentId = `${displayName}-${ComponentStyle.generateName(displayName)}`
    }

    return parentComponentId !== undefined
      ? `${parentComponentId}-${componentId}`
      : componentId
  }

  // I know this is ugly, but this does a bit of loop unrolling,
  // and avoids boolean casts in order to generate strings up to ~11x faster than
  // an approach such as [...classes].filter(Boolean).join(' ')
  // (and uses way less memory from the two array allocations in ^)
  // and  ~ 36 % faster than always adding a whitespace and then calling .trim at the end
  // https://jsperf.com/testing-classname-building-performance
  /* eslint-disable react/prop-types */
  const makeClassName = (
    styledComponentId: string,
    generatedClassName: string,
    propsClassName: ?string, // if a classname was passed in
    attrsClassName: ?string
  ): string => {
    let className = propsClassName || ''
    if (className.length > 0) {
      className += ' '
    }
    className += styledComponentId
    if (attrsClassName !== undefined) {
      if (className.length > 0) {
        className += ' '
      }
      // $FlowFixME
      className += attrsClassName
    }
    if (className.length > 0) {
      className += ' '
    }
    className += generatedClassName

    return className
  }

  const renderTarget = (
    isStatic: boolean,
    className: string,
    props: any,
    target: any,
    attrs: any
  ) => {
    const { innerRef } = props

    const propsForElement = {
      className,
      ...attrs,
    }

    let isTargetTag = isTag(target)
    if (isStyledComponent(target)) {
      propsForElement.innerRef = innerRef
      isTargetTag = false
    } else {
      propsForElement.ref = innerRef
    }

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const propName in props) {
      // Don't pass through non HTML tags through to HTML elements
      // always omit innerRef
      if (
        propName !== 'innerRef' &&
        propName !== 'className' &&
        (isStatic || !isTargetTag || validAttr(propName))
      ) {
        // eslint-disable-next-line no-param-reassign
        propsForElement[propName] = props[propName]
      }
    }

    return createElement(target, propsForElement)
  }

  class StaticStyledComponent extends Component {
    static target: Target
    static styledComponentId: string
    static attrs: Object
    static componentStyle: Object

    // Only need the style sheet in context
    static contextTypes = {
      [CONTEXT_KEY]: PropTypes.oneOfType([
        PropTypes.instanceOf(StyleSheet),
        PropTypes.instanceOf(ServerStyleSheet),
      ]),
    }

    state = {
      generatedClassName: '',
    }

    constructor(props, context) {
      super(props, context)
      const styleSheet = context[CONTEXT_KEY] || StyleSheet.instance
      const { componentStyle } = this.constructor

      this.state = {
        generatedClassName: componentStyle.generateAndInjectStyles(
          STATIC_EXECUTION_CONTEXT,
          styleSheet
        ),
      }
    }

    render() {
      const { target } = this.constructor
      const attrsClassName =
        this.constructor.attrs !== undefined
          ? this.constructor.attrs.className
          : undefined

      const className = makeClassName(
        this.constructor.styledComponentId,
        this.state.generatedClassName,
        this.props.className,
        attrsClassName
      )

      return renderTarget(
        true,
        className,
        this.props,
        target,
        this.constructor.attrs
      )
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class DynamicallyStyledComponent extends Component {
    static target: Target
    static styledComponentId: string
    static attrs: Object
    static componentStyle: Object
    static warnTooManyClasses: Function

    static contextTypes = {
      [CHANNEL_NEXT]: CONTEXT_CHANNEL_SHAPE,
      [CONTEXT_KEY]: PropTypes.oneOfType([
        PropTypes.instanceOf(StyleSheet),
        PropTypes.instanceOf(ServerStyleSheet),
      ]),
    }

    attrs = {}
    theme: null
    state = {
      generatedClassName: '',
    }
    unsubscribeId: number = -1

    constructor(props, context) {
      super(props, context)

      const { componentStyle } = this.constructor
      const styledContext = context[CHANNEL_NEXT]
      const styleSheet = context[CONTEXT_KEY] || StyleSheet.instance

      let theme

      if (styledContext !== undefined) {
        const { subscribe, currentTheme } = styledContext
        theme = determineTheme(
          this.props,
          currentTheme(),
          this.constructor.defaultProps
        )
        this.unsubscribeId = subscribe(this.listenToThemeUpdates)
      } else {
        // eslint-disable-next-line react/prop-types
        theme = this.props.theme || {}
      }

      const reusedClassName = this.possiblyReusedClassname(props, theme)
      let generatedClassName
      if (reusedClassName !== false) {
        generatedClassName = reusedClassName
      } else {
        const executionContext = this.buildExecutionContext(theme, props)
        generatedClassName = componentStyle.generateAndInjectStyles(
          executionContext,
          styleSheet
        )

        this.cacheLastPropsAndTheme(props, theme)
      }

      this.theme = theme
      this.state = { generatedClassName }
    }

    cacheLastPropsAndTheme(props: any, theme: any) {
      const { componentStyle, warnTooManyClasses } = this.constructor
      const styleSheet = this.context[CONTEXT_KEY] || StyleSheet.instance

      // Onl cache props and theme generation if StyleSheet thinks
      // styles in general are cacheable. This should only happen
      // on the client because lifecycle methods won't trigger on the server
      // -- inducing memory leaks if cached props and theme are never removed
      if (styleSheet.stylesCacheable) {
        componentStyle.lastProps = props
        componentStyle.lastTheme = theme
      }
    }

    possiblyReusedClassname(props: any, theme: any) {
      const { componentStyle } = this.constructor
      const { lastClassName, lastProps, lastTheme } = componentStyle
      if (
        lastClassName === undefined ||
        lastProps === undefined ||
        lastTheme !== theme
      ) {
        // if this hasn't been set, bail out
        return false
      } else if (lastProps === props) {
        // if this is an incremental re-render or update, re-use the last classname
        return lastClassName
      } else {
        // run shallow equal on the props.
        // ignore the theme property, as we use `determineTheme` to decide what theme
        // to actually use for rendering.
        // If the attribute is a react attributed, _and_, a function,
        // we can rely on "do they both have it, or both not have it".
        const numPropKeys = numComparableDynamicProps(props)
        const numOtherPropsKeys = numComparableDynamicProps(lastProps)

        // we can assume props are plain objects because this is react.
        // therefore we can skip calling hasOwnProp
        if (numPropKeys !== numOtherPropsKeys) {
          // if there are different number of props
          return false
        } else {
          // eslint-disable-next-line no-restricted-syntax, guard-for-in
          for (const propName in props) {
            const prop = props[propName]
            const otherProp = lastProps[propName]
            if (canIgnoreDynamicProp(propName)) {
              // eslint-disable-next-line no-continue
              continue
            } else if (prop !== otherProp) {
              return false
            }
          }

          this.cacheLastPropsAndTheme(props, theme)
          return componentStyle.lastClassName
        }
      }
    }

    unsubscribeFromContext() {
      if (this.unsubscribeId !== -1) {
        this.context[CHANNEL_NEXT].unsubscribe(this.unsubscribeId)
      }
    }

    buildExecutionContext(theme: any, props: any) {
      const { attrs } = this.constructor
      const context = { ...props, theme }
      if (attrs === undefined) {
        return context
      }

      this.attrs = {}
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const key in attrs) {
        const attr = attrs[key]
        this.attrs[key] = typeof attr === 'function' ? attr(context) : attr
      }

      return { ...context, ...this.attrs }
    }

    generateAndInjectStyles(theme: any, props: any) {
      const reusedClassName = this.possiblyReusedClassname(props, theme)
      if (reusedClassName !== false) {
        return reusedClassName
      } else {
        const { componentStyle, warnTooManyClasses } = this.constructor
        const styleSheet = this.context[CONTEXT_KEY] || StyleSheet.instance

        const executionContext = this.buildExecutionContext(theme, props)
        const className = componentStyle.generateAndInjectStyles(
          executionContext,
          styleSheet
        )

        this.cacheLastPropsAndTheme(props, theme)

        if (
          process.env.NODE_ENV !== 'production' &&
          warnTooManyClasses !== undefined
        ) {
          warnTooManyClasses(className)
        }

        return className
      }
    }

    updateThemeAndClassName(theme: any, props: any) {
      const generatedClassName = this.generateAndInjectStyles(theme, props)
      this.theme = theme
      this.setState({ generatedClassName })
    }

    listenToThemeUpdates = nextTheme => {
      // This will be called once immediately
      const theme = determineTheme(
        this.props,
        nextTheme,
        this.constructor.defaultProps
      )
      if (theme !== this.theme) {
        this.updateThemeAndClassName(theme, this.props)
      }
    }

    componentWillUnmount() {
      this.unsubscribeFromContext()

      // Prevent dangling references to this theme and props
      // Which may container reference cycles or DOM nodes, etc
      const { componentStyle } = this.constructor
      if (componentStyle.lastProps === this.props) {
        componentStyle.lastProps = undefined
        componentStyle.lastTheme = undefined
      }
    }

    componentWillReceiveProps(nextProps: {
      theme?: Theme,
      [key: string]: any,
    }) {
      const theme = determineTheme(
        nextProps,
        this.theme,
        this.constructor.defaultProps
      )
      const reusedClassName = this.possiblyReusedClassname(nextProps, theme)
      if (reusedClassName === false) {
        const generatedClassName = this.generateAndInjectStyles(
          theme,
          nextProps
        )
        this.theme = theme
        this.setState({ generatedClassName })
      } else if (reusedClassName !== this.state.generatedClassName) {
        this.setState({ generatedClassName: reusedClassName })
      }
    }

    render() {
      const { target } = this.constructor
      const className = makeClassName(
        this.constructor.styledComponentId,
        this.state.generatedClassName,
        this.props.className,
        this.attrs.className
      )

      return renderTarget(
        false,
        className,
        this.props,
        target,
        this.constructor.attrs
      )
    }
  }

  const createStyledComponent = (
    target: Target,
    options: Object,
    rules: RuleSet
  ) => {
    const {
      displayName = isTag(target)
        ? `styled.${target}`
        : `Styled(${getComponentName(target)})`,
      componentId = generateId(options.displayName, options.parentComponentId),
      rules: extendingRules,
      attrs,
    } = options

    let { ParentComponent: _ParentComponent } = options

    const styledComponentId =
      options.displayName && options.componentId
        ? `${options.displayName}-${options.componentId}`
        : componentId

    let componentTarget = target
    let componentRules = rules

    // Auto-extend styled-components to reduce Higher-Order-Component Soup problems.
    // You may be wondering if this is performant, but with umbrella caching,
    // it should be fine :tm:
    // we can't actually use a `isStyledComponent(target)` check here
    // because higher-order-components like `connect` will `lift` static attributes.
    // this is great because we can then use `connect(styled())` for styling
    // with classname selectors `css` tagged-template-literals, _but_
    // it means we can't auto-extend them directly.
    // To check if its a styled-component under the hood,
    // we have to do a prototype check check
    if (
      (target.prototype instanceof StaticStyledComponent ||
        target.prototype instanceof DynamicallyStyledComponent) &&
      target.componentStyle
    ) {
      componentTarget = target.target
      componentRules = target.componentStyle.rules.concat(componentRules)
    }

    let warnTooManyClasses
    if (process.env.NODE_ENV !== 'production') {
      warnTooManyClasses = createWarnTooManyClasses(displayName)
    }

    const componentStyle = new ComponentStyle(
      extendingRules === undefined
        ? componentRules
        : extendingRules.concat(componentRules),
      attrs,
      styledComponentId
    )

    if (!_ParentComponent) {
      if (componentStyle.isStatic) {
        _ParentComponent = StaticStyledComponent
      } else {
        _ParentComponent = DynamicallyStyledComponent
      }
    }

    class StyledComponent extends _ParentComponent {
      static displayName = displayName
      static styledComponentId = styledComponentId
      static attrs = attrs
      static componentStyle = componentStyle
      static target = componentTarget

      static withComponent(tag) {
        const { componentId: previousComponentId, ...optionsToCopy } = options

        const newComponentId =
          previousComponentId &&
          `${previousComponentId}-${
            isTag(tag) ? tag : escape(getComponentName(tag))
          }`

        const newOptions = {
          ...optionsToCopy,
          componentId: newComponentId,
          ParentComponent: StyledComponent,
        }

        return createStyledComponent(tag, newOptions, rules)
      }

      static get extend() {
        const {
          rules: rulesFromOptions,
          componentId: parentComponentId,
          ...optionsToCopy
        } = options

        const newRules =
          rulesFromOptions === undefined
            ? rules
            : rulesFromOptions.concat(rules)

        const newOptions = {
          ...optionsToCopy,
          rules: newRules,
          parentComponentId,
          ParentComponent: StyledComponent,
        }

        return constructWithOptions(createStyledComponent, target, newOptions)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      StyledComponent.warnTooManyClasses = createWarnTooManyClasses(displayName)
    }

    return StyledComponent
  }

  return createStyledComponent
}
