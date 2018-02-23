'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _ThemeProvider = require('../models/ThemeProvider');

var _isStyledComponent2 = require('../utils/isStyledComponent');

var _isStyledComponent3 = _interopRequireDefault(_isStyledComponent2);

var _determineTheme = require('../utils/determineTheme');

var _determineTheme2 = _interopRequireDefault(_determineTheme);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
/* globals ReactClass */

var wrapWithTheme = function wrapWithTheme(Component) {
  var _WithTheme$contextTyp;

  var componentName = Component.displayName || Component.name || 'Component';

  var isStyledComponent = (0, _isStyledComponent3.default)(Component);

  var WithTheme = function (_React$Component) {
    _inherits(WithTheme, _React$Component);

    // NOTE: This is so that isStyledComponent passes for the innerRef unwrapping
    function WithTheme(props, context) {
      _classCallCheck(this, WithTheme);

      var _this = _possibleConstructorReturn(this, _React$Component.call(this, props, context));

      _this.state = {};
      _this.unsubscribeId = -1;

      _this.updateTheme = function (nextTheme) {
        var theme = (0, _determineTheme2.default)(_this.props, nextTheme, _this.constructor.defaultProps);
        if (theme !== _this.state.theme) {
          _this.setState({ theme: theme });
        }
      };

      var defaultProps = _this.constructor.defaultProps;

      var styledContext = context[_ThemeProvider.CHANNEL_NEXT];
      var themeProp = (0, _determineTheme2.default)(props, undefined, defaultProps);

      if (styledContext === undefined && themeProp === undefined && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[withTheme] You are not using a ThemeProvider nor passing a theme prop or a theme in defaultProps');
      } else if (styledContext === undefined && themeProp !== undefined) {
        _this.state = {
          theme: themeProp
        };
      } else {
        var subscribe = styledContext.subscribe,
            currentTheme = styledContext.currentTheme;

        _this.state = {
          theme: currentTheme()
        };

        _this.unsubscribeId = subscribe(_this.updateTheme);
      }
      return _this;
    }

    WithTheme.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      var defaultProps = this.constructor.defaultProps;

      var theme = (0, _determineTheme2.default)(nextProps, this.state.theme, defaultProps);
      if (theme !== this.state.theme) {
        this.setState({ theme: theme });
      }
    };

    WithTheme.prototype.componentWillUnmount = function componentWillUnmount() {
      if (this.unsubscribeId !== -1) {
        this.context[_ThemeProvider.CHANNEL_NEXT].unsubscribe(this.unsubscribeId);
      }
    };

    WithTheme.prototype.render = function render() {
      // eslint-disable-next-line react/prop-types
      var innerRef = this.props.innerRef;
      var theme = this.state.theme;


      return _react2.default.createElement(Component, _extends({
        theme: theme
      }, this.props, {
        innerRef: isStyledComponent ? innerRef : undefined,
        ref: isStyledComponent ? undefined : innerRef
      }));
    };

    return WithTheme;
  }(_react2.default.Component);

  WithTheme.displayName = 'WithTheme(' + componentName + ')';
  WithTheme.styledComponentId = 'withTheme';
  WithTheme.contextTypes = (_WithTheme$contextTyp = {}, _WithTheme$contextTyp[_ThemeProvider.CHANNEL] = _propTypes2.default.func, _WithTheme$contextTyp[_ThemeProvider.CHANNEL_NEXT] = _ThemeProvider.CONTEXT_CHANNEL_SHAPE, _WithTheme$contextTyp);


  return (0, _hoistNonReactStatics2.default)(WithTheme, Component);
};

exports.default = wrapWithTheme;
module.exports = exports['default'];