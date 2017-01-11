'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var wrapFunction = function wrapFunction(func) {
    return function () {
        return {
            type: "call",
            name: func.name || func.toString(),
            version: (0, _md2.default)(func),
            args: arguments,
            func: func
        };
    };
};

var call = function call(func) {
    return wrapFunction(func);
};
call.wrap = function (obj) {
    return (0, _keys2.default)(obj).reduce(function (result, key) {
        if (typeof obj[key] === "function") {
            result[key] = wrapFunction(obj[key]);
        } else {
            result[key] = obj[key];
        }
        return result;
    }, {});
};

exports.default = call;
//# sourceMappingURL=call.js.map