'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _createWarnTooManyClasses = require('../utils/createWarnTooManyClasses');

var _createWarnTooManyClasses2 = _interopRequireDefault(_createWarnTooManyClasses);

var _isTag = require('../utils/isTag');

var _isTag2 = _interopRequireDefault(_isTag);

var _validAttr = require('../utils/validAttr');

var _validAttr2 = _interopRequireDefault(_validAttr);

var _isStyledComponent = require('../utils/isStyledComponent');

var _isStyledComponent2 = _interopRequireDefault(_isStyledComponent);

var _getComponentName = require('../utils/getComponentName');

var _getComponentName2 = _interopRequireDefault(_getComponentName);

var _determineTheme = require('../utils/determineTheme');

var _determineTheme2 = _interopRequireDefault(_determineTheme);

var _ThemeProvider = require('./ThemeProvider');

var _StyleSheet = require('./StyleSheet');

var _StyleSheet2 = _interopRequireDefault(_StyleSheet);

var _ServerStyleSheet = require('./ServerStyleSheet');

var _ServerStyleSheet2 = _interopRequireDefault(_ServerStyleSheet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var babelPluginFlowReactPropTypes_proptype_Theme = require('./ThemeProvider').babelPluginFlowReactPropTypes_proptype_Theme || require('prop-types').any;

var babelPluginFlowReactPropTypes_proptype_Target = require('../types').babelPluginFlowReactPropTypes_proptype_Target || require('prop-types').any;

var babelPluginFlowReactPropTypes_proptype_RuleSet = require('../types').babelPluginFlowReactPropTypes_proptype_RuleSet || require('prop-types').any;

var escapeRegex = /[[\].#*$><+~=|^:(),"'`]/g;
var multiDashRegex = /--+/g;

// HACK for generating all static styles without needing to allocate
// an empty execution context every single time...
var STATIC_EXECUTION_CONTEXT = {};

// When doing cross-instance dymaic style caching, can we ignore this
// property based on its name?
// If its a react event handler, or a few specific props, we can!
// NOTE: this breaks if you rely on react event handlers presecence
// for styling. This is not a good practice imo, but I would like to
// add an escape hatch for this.
var canIgnoreDynamicProp = function canIgnoreDynamicProp(propName) {
  return (0, _validAttr.isReactFunction)(propName) || // ignore react event handlers
  propName === 'children' || // ignore children props in favor of explicit props on the component
  propName === 'className' || // passed in classnames from the parent should not matter
  propName === 'innerRef' || // ref and inner ref are outside of scope for styling
  propName === 'ref' || propName === 'theme' || // we compare themes based on the `determined` theme
  propName === 'style';
}; // style overrides should not affect css styles

// count the number of dynamic properties that are comparable
// when doing 'umbrella' caching of style generation across
// dynamic instances
var numComparableDynamicProps = function numComparableDynamicProps(props) {
  var numProps = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (var propName in props) {
    if (canIgnoreDynamicProp(propName)) {
      // eslint-disable-next-line no-continue
      continue;
    } else {
      numProps += 1;
    }
  }

  return numProps;
};

exports.default = function (ComponentStyle, constructWithOptions) {
  var _StaticStyledComponen, _DynamicallyStyledCom;

  /* We depend on components having unique IDs */
  var identifiers = {};
  var generateId = function generateId(_displayName, parentComponentId) {
    var displayName = typeof _displayName !== 'string' ? 'sc' : _displayName.replace(escapeRegex, '-') // Replace all possible CSS selectors
    .replace(multiDashRegex, '-'); // Replace multiple -- with single -

    var nr = (identifiers[displayName] || 0) + 1;
    identifiers[displayName] = nr;

    var hash = ComponentStyle.generateName(displayName + nr);
    var componentId = displayName + '-' + hash;
    return parentComponentId !== undefined ? parentComponentId + '-' + componentId : componentId;
  };

  // I know this is ugly, but this does a bit of loop unrolling,
  // and avoids boolean casts in order to generate strings up to ~11x faster than
  // an approach such as [...classes].filter(Boolean).join(' ')
  // (and uses way less memory from the two array allocations in ^)
  // and  ~ 36 % faster than always adding a whitespace and then calling .trim at the end
  // https://jsperf.com/testing-classname-building-performance
  /* eslint-disable react/prop-types */
  var makeClassName = function makeClassName(styledComponentId, generatedClassName, propsClassName, attrsClassName) {
    var className = propsClassName || '';
    if (className.length > 0) {
      className += ' ';
    }
    className += styledComponentId;
    if (attrsClassName !== undefined) {
      if (className.length > 0) {
        className += ' ';
      }
      // $FlowFixME
      className += attrsClassName;
    }
    if (className.length > 0) {
      className += ' ';
    }
    className += generatedClassName;

    return className;
  };

  var renderTarget = function renderTarget(isStatic, className, props, target, attrs) {
    var innerRef = props.innerRef;


    var propsForElement = _extends({
      className: className
    }, attrs);

    var isTargetTag = (0, _isTag2.default)(target);
    if ((0, _isStyledComponent2.default)(target)) {
      propsForElement.innerRef = innerRef;
      isTargetTag = false;
    } else {
      propsForElement.ref = innerRef;
    }

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (var propName in props) {
      // Don't pass through non HTML tags through to HTML elements
      // always omit innerRef
      if (propName !== 'innerRef' && propName !== 'className' && (isStatic || !isTargetTag || (0, _validAttr2.default)(propName))) {
        // eslint-disable-next-line no-param-reassign
        propsForElement[propName] = props[propName];
      }
    }

    return (0, _react.createElement)(target, propsForElement);
  };

  var StaticStyledComponent = function (_Component) {
    _inherits(StaticStyledComponent, _Component);

    // Only need the style sheet in context
    function StaticStyledComponent(props, context) {
      _classCallCheck(this, StaticStyledComponent);

      var _this = _possibleConstructorReturn(this, _Component.call(this, props, context));

      _this.state = {
        generatedClassName: ''
      };

      var styleSheet = context[_StyleSheet.CONTEXT_KEY] || _StyleSheet2.default.instance;
      var componentStyle = _this.constructor.componentStyle;


      _this.state = {
        generatedClassName: componentStyle.generateAndInjectStyles(STATIC_EXECUTION_CONTEXT, styleSheet)
      };
      return _this;
    }

    StaticStyledComponent.prototype.render = function render() {
      var target = this.constructor.target;

      var attrsClassName = this.constructor.attrs !== undefined ? this.constructor.attrs.className : undefined;

      var className = makeClassName(this.constructor.styledComponentId, this.state.generatedClassName, this.props.className, attrsClassName);

      return renderTarget(true, className, this.props, target, this.constructor.attrs);
    };

    return StaticStyledComponent;
  }(_react.Component);

  // eslint-disable-next-line react/no-multi-comp


  StaticStyledComponent.contextTypes = (_StaticStyledComponen = {}, _StaticStyledComponen[_StyleSheet.CONTEXT_KEY] = _propTypes2.default.oneOfType([_propTypes2.default.instanceOf(_StyleSheet2.default), _propTypes2.default.instanceOf(_ServerStyleSheet2.default)]), _StaticStyledComponen);

  var DynamicallyStyledComponent = function (_Component2) {
    _inherits(DynamicallyStyledComponent, _Component2);

    function DynamicallyStyledComponent(props, context) {
      _classCallCheck(this, DynamicallyStyledComponent);

      var _this2 = _possibleConstructorReturn(this, _Component2.call(this, props, context));

      _initialiseProps.call(_this2);

      var componentStyle = _this2.constructor.componentStyle;

      var styledContext = context[_ThemeProvider.CHANNEL_NEXT];
      var styleSheet = context[_StyleSheet.CONTEXT_KEY] || _StyleSheet2.default.instance;

      var theme = void 0;

      if (styledContext !== undefined) {
        var subscribe = styledContext.subscribe,
            currentTheme = styledContext.currentTheme;

        theme = (0, _determineTheme2.default)(_this2.props, currentTheme(), _this2.constructor.defaultProps);
        _this2.unsubscribeId = subscribe(_this2.listenToThemeUpdates);
      } else {
        // eslint-disable-next-line react/prop-types
        theme = _this2.props.theme || {};
      }

      var reusedClassName = _this2.possiblyReusedClassname(props, theme);
      var generatedClassName = void 0;
      if (reusedClassName !== false) {
        generatedClassName = reusedClassName;
      } else {
        var executionContext = _this2.buildExecutionContext(theme, props);
        generatedClassName = componentStyle.generateAndInjectStyles(executionContext, styleSheet);

        componentStyle.lastProps = props;
        componentStyle.lastTheme = theme;
      }

      _this2.theme = theme;
      _this2.state = { generatedClassName: generatedClassName };
      return _this2;
    }

    DynamicallyStyledComponent.prototype.possiblyReusedClassname = function possiblyReusedClassname(props, theme) {
      var componentStyle = this.constructor.componentStyle;
      var lastClassName = componentStyle.lastClassName,
          lastProps = componentStyle.lastProps,
          lastTheme = componentStyle.lastTheme;

      if (lastClassName === undefined || lastProps === undefined || lastTheme !== theme) {
        // if this hasn't been set, bail out
        return false;
      } else if (lastProps === props) {
        // if this is an incremental re-render or update, re-use the last classname
        return lastClassName;
      } else {
        // run shallow equal on the props.
        // ignore the theme property, as we use `determineTheme` to decide what theme
        // to actually use for rendering.
        // If the attribute is a react attributed, _and_, a function,
        // we can rely on "do they both have it, or both not have it".
        var numPropKeys = numComparableDynamicProps(props);
        var numOtherPropsKeys = numComparableDynamicProps(lastProps);

        // we can assume props are plain objects because this is react.
        // therefore we can skip calling hasOwnProp
        if (numPropKeys !== numOtherPropsKeys) {
          // if there are different number of props
          return false;
        } else {
          // eslint-disable-next-line no-restricted-syntax, guard-for-in
          for (var propName in props) {
            var prop = props[propName];
            var otherProp = lastProps[propName];
            if (canIgnoreDynamicProp(propName)) {
              // eslint-disable-next-line no-continue
              continue;
            } else if (prop !== otherProp) {
              return false;
            }
          }

          // we're good to go
          componentStyle.lastProps = props;
          componentStyle.lastTheme = theme;
          return componentStyle.lastClassName;
        }
      }
    };

    DynamicallyStyledComponent.prototype.unsubscribeFromContext = function unsubscribeFromContext() {
      if (this.unsubscribeId !== -1) {
        this.context[_ThemeProvider.CHANNEL_NEXT].unsubscribe(this.unsubscribeId);
      }
    };

    DynamicallyStyledComponent.prototype.buildExecutionContext = function buildExecutionContext(theme, props) {
      var attrs = this.constructor.attrs;

      var context = _extends({}, props, { theme: theme });
      if (attrs === undefined) {
        return context;
      }

      this.attrs = {};
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (var _key in attrs) {
        var attr = attrs[_key];
        this.attrs[_key] = typeof attr === 'function' ? attr(context) : attr;
      }

      return _extends({}, context, this.attrs);
    };

    DynamicallyStyledComponent.prototype.generateAndInjectStyles = function generateAndInjectStyles(theme, props) {
      var reusedClassName = this.possiblyReusedClassname(props, theme);
      if (reusedClassName !== false) {
        return reusedClassName;
      } else {
        var _constructor = this.constructor,
            componentStyle = _constructor.componentStyle,
            warnTooManyClasses = _constructor.warnTooManyClasses;

        var styleSheet = this.context[_StyleSheet.CONTEXT_KEY] || _StyleSheet2.default.instance;

        var executionContext = this.buildExecutionContext(theme, props);
        var className = componentStyle.generateAndInjectStyles(executionContext, styleSheet);

        componentStyle.lastProps = props;
        componentStyle.lastTheme = theme;

        if (warnTooManyClasses !== undefined) warnTooManyClasses(className);

        return className;
      }
    };

    DynamicallyStyledComponent.prototype.updateThemeAndClassName = function updateThemeAndClassName(theme, props) {
      var generatedClassName = this.generateAndInjectStyles(theme, props);
      this.theme = theme;
      this.setState({ generatedClassName: generatedClassName });
    };

    DynamicallyStyledComponent.prototype.componentWillUnmount = function componentWillUnmount() {
      this.unsubscribeFromContext();
    };

    DynamicallyStyledComponent.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      var theme = (0, _determineTheme2.default)(nextProps, this.theme, this.constructor.defaultProps);
      var reusedClassName = this.possiblyReusedClassname(nextProps, theme);
      if (reusedClassName === false) {
        var generatedClassName = this.generateAndInjectStyles(theme, nextProps);
        this.theme = theme;
        this.setState({ generatedClassName: generatedClassName });
      } else if (reusedClassName !== this.state.generatedClassName) {
        this.setState({ generatedClassName: reusedClassName });
      }
    };

    DynamicallyStyledComponent.prototype.render = function render() {
      var target = this.constructor.target;

      var className = makeClassName(this.constructor.styledComponentId, this.state.generatedClassName, this.props.className, this.attrs.className);

      return renderTarget(false, className, this.props, target, this.constructor.attrs);
    };

    return DynamicallyStyledComponent;
  }(_react.Component);

  DynamicallyStyledComponent.contextTypes = (_DynamicallyStyledCom = {}, _DynamicallyStyledCom[_ThemeProvider.CHANNEL_NEXT] = _ThemeProvider.CONTEXT_CHANNEL_SHAPE, _DynamicallyStyledCom[_StyleSheet.CONTEXT_KEY] = _propTypes2.default.oneOfType([_propTypes2.default.instanceOf(_StyleSheet2.default), _propTypes2.default.instanceOf(_ServerStyleSheet2.default)]), _DynamicallyStyledCom);

  var _initialiseProps = function _initialiseProps() {
    var _this4 = this;

    this.attrs = {};
    this.state = {
      generatedClassName: ''
    };
    this.unsubscribeId = -1;

    this.listenToThemeUpdates = function (nextTheme) {
      // This will be called once immediately
      var theme = (0, _determineTheme2.default)(_this4.props, nextTheme, _this4.constructor.defaultProps);
      if (theme !== _this4.theme) {
        _this4.updateThemeAndClassName(theme, _this4.props);
      }
    };
  };

  var createStyledComponent = function createStyledComponent(target, options, rules) {
    var _options$displayName = options.displayName,
        displayName = _options$displayName === undefined ? (0, _isTag2.default)(target) ? 'styled.' + target : 'Styled(' + (0, _getComponentName2.default)(target) + ')' : _options$displayName,
        _options$componentId = options.componentId,
        componentId = _options$componentId === undefined ? generateId(options.displayName, options.parentComponentId) : _options$componentId,
        extendingRules = options.rules,
        attrs = options.attrs;
    var _ParentComponent = options.ParentComponent;


    var styledComponentId = options.displayName && options.componentId ? options.displayName + '-' + options.componentId : componentId;

    var warnTooManyClasses = void 0;
    if (process.env.NODE_ENV !== 'production') {
      warnTooManyClasses = (0, _createWarnTooManyClasses2.default)(displayName);
    }

    var componentStyle = new ComponentStyle(extendingRules === undefined ? rules : extendingRules.concat(rules), attrs, styledComponentId);

    if (!_ParentComponent) {
      if (componentStyle.isStatic) {
        _ParentComponent = StaticStyledComponent;
      } else {
        _ParentComponent = DynamicallyStyledComponent;
      }
    }

    var StyledComponent = function (_ParentComponent2) {
      _inherits(StyledComponent, _ParentComponent2);

      function StyledComponent() {
        _classCallCheck(this, StyledComponent);

        return _possibleConstructorReturn(this, _ParentComponent2.apply(this, arguments));
      }

      StyledComponent.withComponent = function withComponent(tag) {
        var previousComponentId = options.componentId,
            optionsToCopy = _objectWithoutProperties(options, ['componentId']);

        var newComponentId = previousComponentId && previousComponentId + '-' + ((0, _isTag2.default)(tag) ? tag : (0, _getComponentName2.default)(tag));

        var newOptions = _extends({}, optionsToCopy, {
          componentId: newComponentId,
          ParentComponent: StyledComponent
        });

        return createStyledComponent(tag, newOptions, rules);
      };

      _createClass(StyledComponent, null, [{
        key: 'extend',
        get: function get() {
          var rulesFromOptions = options.rules,
              parentComponentId = options.componentId,
              optionsToCopy = _objectWithoutProperties(options, ['rules', 'componentId']);

          var newRules = rulesFromOptions === undefined ? rules : rulesFromOptions.concat(rules);

          var newOptions = _extends({}, optionsToCopy, {
            rules: newRules,
            parentComponentId: parentComponentId,
            ParentComponent: StyledComponent
          });

          return constructWithOptions(createStyledComponent, target, newOptions);
        }
      }]);

      return StyledComponent;
    }(_ParentComponent);

    StyledComponent.displayName = displayName;
    StyledComponent.styledComponentId = styledComponentId;
    StyledComponent.attrs = attrs;
    StyledComponent.componentStyle = componentStyle;
    StyledComponent.warnTooManyClasses = warnTooManyClasses;
    StyledComponent.target = target;


    return StyledComponent;
  };

  return createStyledComponent;
};

module.exports = exports['default'];