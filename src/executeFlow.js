//@flow
import type {Flow, FlowMessage, FlowAbort, CommitFlow, CompleteFlow, Observer} from './types';

export default function(flow: Flow, commitFlow?: CommitFlow, completeFlow?: CompleteFlow) {
    return function(observer: Observer) {
        let aborted = false;
        (async function() {
            if (!flow.execution) return;

            let generator = flow.execution();
            let {done, value} = generator.next();
            let nextGeneratorValue;

            for (let i=0; !done; i++) {
                if (value && value.type === "flowCall") {
                    let cachedStep = flow.cachedSteps[i];
                    if (cachedStep && cachedStep.type === "flowCall") {
                        nextGeneratorValue = cachedStep.result;
                    }
                    else {
                        nextGeneratorValue = value.func.apply(null, value.args);
                        if (nextGeneratorValue && nextGeneratorValue.then) {
                            nextGeneratorValue = await nextGeneratorValue;
                        }
                        flow.cachedSteps[i] = {type: "flowCall", ...value, result: nextGeneratorValue};
                        if (aborted) {
                          const flowAbort: FlowAbort = {type: "flowAbort", aborted: true}
                          flow.cachedSteps[i+1] = flowAbort;
                          observer.onNext(flowAbort);
                          if (commitFlow) commitFlow(flow);
                          return;
                        }
                        if (commitFlow) commitFlow(flow);
                    }
                }
                else {
                    const flowMessage: FlowMessage = {type: "flowMessage", payload: value};
                    flow.cachedSteps[i] = flowMessage;
                    observer.onNext(flowMessage);
                }

                let next = generator.next(nextGeneratorValue);
                done = next.done;
                value = next.value;
            }
        })()
        .then(()=> {
            if (completeFlow) completeFlow(flow);
            observer.onCompleted()
        })
        .catch(ex=> {});

        return () => aborted = true;
    }
}
