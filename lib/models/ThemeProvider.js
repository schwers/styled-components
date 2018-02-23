'use strict';

exports.__esModule = true;
exports.CONTEXT_CHANNEL_SHAPE = exports.CHANNEL_NEXT = exports.CHANNEL = undefined;

var _ThemeProvider$childC;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _createBroadcast = require('../utils/create-broadcast');

var _createBroadcast2 = _interopRequireDefault(_createBroadcast);

var _once = require('../utils/once');

var _once2 = _interopRequireDefault(_once);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
/* globals React$Element */


var babelPluginFlowReactPropTypes_proptype_Broadcast = require('../utils/create-broadcast').babelPluginFlowReactPropTypes_proptype_Broadcast || require('prop-types').any;

// NOTE: DO NOT CHANGE, changing this is a semver major change!
var CHANNEL = exports.CHANNEL = '__styled-components__';
var CHANNEL_NEXT = exports.CHANNEL_NEXT = CHANNEL + 'next__';

var CONTEXT_CHANNEL_SHAPE = exports.CONTEXT_CHANNEL_SHAPE = _propTypes2.default.shape({
  getTheme: _propTypes2.default.func, // slow, please avoid using
  subscribe: _propTypes2.default.func,
  unsubscribe: _propTypes2.default.func,
  currentTheme: _propTypes2.default.func
});

if (typeof exports !== 'undefined') Object.defineProperty(exports, 'babelPluginFlowReactPropTypes_proptype_Theme', {
  value: require('prop-types').shape({})
});


var warnChannelDeprecated = (0, _once2.default)(function () {
  // eslint-disable-next-line no-console
  console.error('Warning: Usage of `context.' + CHANNEL + '` as a function is deprecated. It will be replaced with the object on `.context.' + CHANNEL_NEXT + '` in a future version.');
});
/**
 * Provide a theme to an entire react component tree via context and event listeners (have to do
 * both context and event emitter as pure components block context updates)
 */

var ThemeProvider = function (_Component) {
  _inherits(ThemeProvider, _Component);

  function ThemeProvider(props) {
    _classCallCheck(this, ThemeProvider);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.unsubscribeToOuterId = -1;

    _this.getTheme = _this.getTheme.bind(_this);
    _this.broadcast = (0, _createBroadcast2.default)(_this.getTheme(props.theme));
    return _this;
  }

  ThemeProvider.prototype.getChildContext = function getChildContext() {
    var _this2 = this,
        _extends2;

    return _extends({}, this.context, (_extends2 = {}, _extends2[CHANNEL_NEXT] = {
      getTheme: this.getTheme,
      subscribe: this.broadcast.subscribe,
      unsubscribe: this.broadcast.unsubscribe,
      currentTheme: this.broadcast.currentState
    }, _extends2[CHANNEL] = function (subscriber) {
      warnChannelDeprecated();

      // Patch the old `subscribe` provide via `CHANNEL` for older clients.
      var unsubscribeId = _this2.broadcast.subscribe(subscriber);
      return function () {
        return _this2.broadcast.unsubscribe(unsubscribeId);
      };
    }, _extends2));
  };

  ThemeProvider.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (this.props.theme !== nextProps.theme) this.broadcast.publish(this.getTheme(nextProps.theme));
  };

  // Get the theme from the props, supporting both (outerTheme) => {} as well as object notation


  ThemeProvider.prototype.getTheme = function getTheme(passedTheme) {
    var theme = passedTheme || this.props.theme;
    return theme;
  };

  ThemeProvider.prototype.render = function render() {
    if (!this.props.children) {
      return null;
    }
    return _react2.default.Children.only(this.props.children);
  };

  return ThemeProvider;
}(_react.Component);

ThemeProvider.propTypes = {
  children: require('prop-types').any,
  theme: require('prop-types').oneOfType([require('prop-types').shape({}), require('prop-types').func]).isRequired
};


ThemeProvider.childContextTypes = (_ThemeProvider$childC = {}, _ThemeProvider$childC[CHANNEL] = _propTypes2.default.func, _ThemeProvider$childC[CHANNEL_NEXT] = CONTEXT_CHANNEL_SHAPE, _ThemeProvider$childC);

exports.default = ThemeProvider;