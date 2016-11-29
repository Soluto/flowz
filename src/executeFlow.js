//@flow
import type {Flow, CommitFlow, CompleteFlow, Observer} from './types';

export default function(flow: Flow, commitFlow?: CommitFlow, completeFlow?: CompleteFlow) {
    return function(observer: Observer<*>) {
        let aborted = false;
        (async function() {
            let generator = flow.execution();
            let {done, value} = generator.next();
            for (let i=0; !done; i++) {
                let result;
                if (value && value.type === "flowCall") {
                    let executedStep = flow.steps[i];
                    if (executedStep.type === "flowCall") {
                        result = executedStep.result;
                    }
                    else {
                        result = value.func.apply(null, value.args);
                        if (result && result.then) {
                            result = await result;
                            if (aborted) return;
                        }
                        flow.steps[i] = {...value, result};
                        if (commitFlow) commitFlow(flow);
                    }
                }
                else {
                    flow.steps[i] = {type: "message", message: value};
                    observer.onNext(value);
                }
                let next = generator.next(result);
                done = next.done;
                value = next.value;
            }
        })()
        .then(()=> {
            if (completeFlow) completeFlow(flow);
            observer.onCompleted()
        })
        .catch(ex=> {});
    }
}
