//@flow
import type {FlowCall} from './types';
import md5 from 'md5';

const wrapFunction = function(func: Function) {
    return function() {
      return {
          type: "call",
          name: func.name || func.toString(),
          version: md5(func),
          args: arguments,
          func
        }
    };
}

const call = (func: Function) => wrapFunction(func);
call.wrap = (obj: *) =>
  Object.keys(obj).reduce((result, key) => {
      if (typeof obj[key] === "function") {
          result[key] = wrapFunction(obj[key]);
      }
      else {
          result[key] = obj[key];
      }
      return result;
}, {});

export default call;
