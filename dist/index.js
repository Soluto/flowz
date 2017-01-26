'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.call = exports.send = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.executeFlow = executeFlow;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//usage of static 'send' method for better client api'
var _send = function _send(item) {};
var send = exports.send = function send(item) {
    return _send(item);
};

var call = exports.call = require('./call').default;

function executeFlow(flow) {
    return function (observer) {
        try {
            flow = _guardFlow(flow);
            (0, _keys2.default)(flow.dependencies).forEach(function (k) {
                if (_isFunction(flow.dependencies[k])) {
                    flow.dependencies[k] = call(flow.dependencies[k]);
                }
            });
        } catch (e) {
            observer.error(e);
            return;
        }

        var stopped = false;
        var generator = flow.execution(flow.dependencies);

        _send = observer.next;
        var i = 0;
        var nextValue = void 0;
        (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
            var _generator$next, done, value, cachedSteps;

            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!true) {
                                _context.next = 28;
                                break;
                            }

                            //start the execution by calling generator
                            _generator$next = generator.next(nextValue), done = _generator$next.done, value = _generator$next.value;

                            if (!done) {
                                _context.next = 4;
                                break;
                            }

                            return _context.abrupt('return');

                        case 4:

                            //resume execution by using cached steps
                            cachedSteps = flow.steps[i];

                            if (!cachedSteps) {
                                _context.next = 9;
                                break;
                            }

                            nextValue = cachedSteps.result;
                            i++;
                            return _context.abrupt('continue', 0);

                        case 9:

                            //continue execution
                            value = _guardNextValue(value);
                            _context.prev = 10;

                            nextValue = value.func ? value.func.apply(null, value.args) : null;

                            if (!_isPromise(nextValue)) {
                                _context.next = 17;
                                break;
                            }

                            _context.next = 15;
                            return nextValue;

                        case 15:
                            nextValue = _context.sent;

                            _send = observer.next;

                        case 17:
                            _context.next = 22;
                            break;

                        case 19:
                            _context.prev = 19;
                            _context.t0 = _context['catch'](10);

                            generator.throw(_context.t0);

                        case 22:

                            flow.steps[i] = { type: value.type, result: nextValue };

                            if (!stopped) {
                                _context.next = 25;
                                break;
                            }

                            return _context.abrupt('return');

                        case 25:
                            i++;
                            _context.next = 0;
                            break;

                        case 28:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this, [[10, 19]]);
        }))().then(function () {
            return observer.complete();
        }).catch(function (error) {
            return observer.error(error);
        });

        return (0, _extends3.default)({}, flow, {
            dispose: function dispose() {
                stopped = true;
            }
        });
    };
}

function _isPromise(obj) {
    return obj && obj.then;
}

function _guardFlow(flow) {
    if (!flow) throw new Error("flow cannot be null");

    if (!flow.name) throw new Error("flow must have a name");

    if (!flow.execution) throw new Error("flow generator cannot be null");

    if (!flow.steps) flow.steps = [];

    if (!flow.dependencies) flow.dependencies = {};

    return flow;
}

function _guardNextValue(value) {
    if (!value) throw new Error("generator yielded null value. Notice to yieled values must function wrap with 'call' method.");

    if (value.type != "call") throw new Error("generator yield value type different than 'call'. type was: " + value.type + ". Did you wrap your function with 'call' method?");

    return value;
}

var _isFunction = function _isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};
//# sourceMappingURL=index.js.map