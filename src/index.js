//@flow
import type {Flow, Observer} from './types';

//usage of static 'send' method for better client api'
let _send = (item: mixed) => {};
export const send = (item: mixed) => _send(item);

export const call = require('./call').default;

export function executeFlow(flow: Flow) {
    return function(observer: Observer) {
        try {
            flow = _guardFlow(flow);
            Object.keys(flow.dependencies).forEach(k => {
                if (_isFunction(flow.dependencies[k])) {
                    flow.dependencies[k] = call(flow.dependencies[k])
                }
            });
        }
        catch (e) {
            observer.error(e);
            return;
        }

        let stopped = false;
        let generator = flow.execution(flow.dependencies);

        let i = 0;
        let nextValue;
        _send = item => observer.next({payload: item, meta: {}});
        (async function() {
            while (true) {
                //start the execution by calling generator
                let {done, value} = generator.next(nextValue);
                if (done) return;

                //resume execution by using cached steps
                let cachedSteps = flow.steps[i];
                if (cachedSteps) {
                    _send = item => observer.next({payload: item, meta: {isResume: true}});
                    nextValue = cachedSteps.result;
                    i++;
                    continue;
                }

                //continue execution
                _send = item => observer.next({payload: item, meta: {}});                
                value = _guardNextValue(value);
                try {
                    nextValue = value.func ? value.func.apply(null, value.args): null;
                    if (_isPromise(nextValue)) {
                        nextValue = await nextValue;
                        _send = item => observer.next({payload: item});
                    }
                }
                catch (e) {
                    generator.throw(e);
                }

                flow.steps[i] = {type: value.type, result: nextValue};
                if (stopped) return;
                i++;
            }
        })()
        .then(() => observer.complete())
        .catch(error => observer.error(error));

        return {
            ...flow,
            dispose: () => {stopped = true;}
        }
    }
}

function _isPromise(obj) {
    return obj && obj.then;
}

function _guardFlow(flow) {
    if (!flow)
        throw new Error("flow cannot be null");

    if (!flow.name)
        throw new Error("flow must have a name");

    if (!flow.execution)
        throw new Error("flow generator cannot be null");

    if (!flow.steps)
        flow.steps = [];

    if (!flow.dependencies)
        flow.dependencies = {};


    return flow;
}

function _guardNextValue(value) {
    if (!value)
        throw new Error("generator yielded null value. Notice to yieled values must function wrap with 'call' method.");

    if (value.type != "call")
        throw new Error("generator yield value type different than 'call'. type was: " + value.type + ". Did you wrap your function with 'call' method?");

    return value;
}

const _isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};