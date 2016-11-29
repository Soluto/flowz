//@flow
import type {FlowCall} from './types';
import md5 from 'md5';

export default function flowify(flowComponent: Function): () => FlowCall {
    if (flowComponent.constructor.name === "Function") {
        return function() {
            return {
                type: "flowCall",
                name: flowComponent.name || flowComponent.toString(),
                id: md5(flowComponent),
                args: arguments,
                func: flowComponent
            };
        }
    }
    return flowComponent;
}
