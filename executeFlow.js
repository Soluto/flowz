//@flow
import type {Flow, CommitFlow, CompleteFlow, Observer} from './types';

export default function(flow: Flow, commitFlow: CommitFlow, completeFlow: CompleteFlow) {
    return async function(observer: Observer<*>) {
        let generator = flow.execution();
        let {done, value} = generator.next();
        for (let i=0; !done; i++) {
            let result;
            if (value.type === "flowCall") {
                let executedStep = flow.steps[i];
                if (executedStep) {
                    result = executedStep.result;
                }
                else {
                    result = value.func.apply(null, value.args);
                    if (result && result.then) {
                        result = await result;
                    }
                    flow.steps[i] = {...value, result};
                    commitFlow(flow);
                }
            }
            else {
                flow.steps[i] = {type: "message", message1: value};
                observer.onNext(value);
            }
            let next = generator.next(result);
            done = next.done;
            value = next.value;
        }
        completeFlow(flow);
        observer.onCompleted();
    }
}