//@flow
import type {Flow, Observer, SaveFlow, CompleteFlow } from './types';

//usage of static 'send' method for better client api'
let _send = (item: mixed) => { };
export const send = (item: mixed) => _send(item);

export const call = require('./call').default;

export function executeFlow(flow: Flow, save?: SaveFlow, complete?: CompleteFlow) {
    return function (observer: Observer) {
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

        //set initial _send
        if (flow.steps.length > 0) {
            _send = (item: mixed) => { };
        }
        else {
            _send = observer.next;
        }

        let i = 0;
        let nextValue;
        (async function () {
            while (true) {
                //resume execution by using cached steps
                //exepecting 'message' type in the cache is for backwards compatability and will be removed in the next major version
                const cachedStep = flow.steps[i];
                const nextCachedStep = flow.steps[i + 1];
                if (!cachedStep) {
                    //cache resolving is done
                }
                else if (cachedStep.type === "call" && !nextCachedStep) {
                    nextValue = cachedStep.result;
                    _send = observer.next;                    
                    generator.next(nextValue);
                    i++;
                    continue;
                }
                else if (cachedStep.type === "call" && nextCachedStep.type === "call") {
                    nextValue = cachedStep.result;
                    generator.next(nextValue);
                    i++;
                    continue;
                }
                else if (cachedStep.type === "call" && nextCachedStep.type === "message") {
                    nextValue = cachedStep.result;
                    i++;
                    continue;
                }            
                else if (cachedStep.type === "message" && !nextCachedStep) {                    
                    generator.next(nextValue);
                    i++;
                    continue;
                }                  
                else if (cachedStep.type === "message" && nextCachedStep.type === "message") {
                    i++;
                    continue;
                }
                else if (cachedStep.type === "message" && nextCachedStep.type === "call") {
                    generator.next(nextValue);
                    i++;
                    continue;
                }

                //continue execution when cache resolving is completed
                let {done, value} = generator.next(nextValue);
                if (done) return;
                _send = observer.next;
                value = _guardNextValue(value);
                try {
                    nextValue = value.func ? value.func.apply(null, value.args) : null;
                    if (_isPromise(nextValue)) {
                        nextValue = await nextValue;
                        _send = observer.next;
                    }
                }
                catch (e) {
                    generator.throw(e);
                }

                flow.steps[i] = { type: value.type, result: nextValue };

                if (save) {
                    const saveMethod = save(flow);
                    if (_isPromise(saveMethod)) {
                        await saveMethod;
                    }
                    if (stopped) return;
                }
                i++;
            }
        })()
            .then(async () => {
                if (complete) {
                    const completeMethod = complete(flow);
                    if (_isPromise(completeMethod)) {
                        await completeMethod;
                    }
                }
                observer.complete()
            })
            .catch(error => observer.error(error));

        return {
            ...flow,
            dispose: () => { stopped = true; }
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

const _isFunction = function (obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};