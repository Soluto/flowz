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

function executeFlow(flow, save, complete) {
    return function (observer) {
        var _this = this;

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

        //set initial _send
        if (flow.steps.length > 0) {
            _send = function _send(item) {};
        } else {
            _send = observer.next;
        }

        var i = 0;
        var nextValue = void 0;
        (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
            var _generator$next, done, value, cachedSteps, saveMethod;

            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!true) {
                                _context.next = 34;
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
                            _send = observer.next;
                            value = _guardNextValue(value);
                            _context.prev = 11;

                            nextValue = value.func ? value.func.apply(null, value.args) : null;

                            if (!_isPromise(nextValue)) {
                                _context.next = 18;
                                break;
                            }

                            _context.next = 16;
                            return nextValue;

                        case 16:
                            nextValue = _context.sent;

                            _send = observer.next;

                        case 18:
                            _context.next = 23;
                            break;

                        case 20:
                            _context.prev = 20;
                            _context.t0 = _context['catch'](11);

                            generator.throw(_context.t0);

                        case 23:

                            flow.steps[i] = { type: value.type, result: nextValue };

                            if (!save) {
                                _context.next = 31;
                                break;
                            }

                            saveMethod = save(flow);

                            if (!_isPromise(saveMethod)) {
                                _context.next = 29;
                                break;
                            }

                            _context.next = 29;
                            return saveMethod;

                        case 29:
                            if (!stopped) {
                                _context.next = 31;
                                break;
                            }

                            return _context.abrupt('return');

                        case 31:
                            i++;
                            _context.next = 0;
                            break;

                        case 34:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this, [[11, 20]]);
        }))().then((0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
            var completeMethod;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            if (!complete) {
                                _context2.next = 5;
                                break;
                            }

                            completeMethod = complete(flow);

                            if (!_isPromise(completeMethod)) {
                                _context2.next = 5;
                                break;
                            }

                            _context2.next = 5;
                            return completeMethod;

                        case 5:
                            observer.complete();

                        case 6:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this);
        }))).catch(function (error) {
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