'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = call;

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function call(func) {
    return function () {
        return {
            type: "call",
            name: func.name || func.toString(),
            version: (0, _md2.default)(func),
            args: arguments,
            func: func
        };
    };
}
//# sourceMappingURL=call.js.map