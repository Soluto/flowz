//@flow
import type {FlowCall} from './types';
import md5 from 'md5';

export default function call(func: Function): () => FlowCall {
    return function() {
        return {
            type: "call",
            name: func.name || func.toString(),
            version: md5(func),
            args: arguments,
            func
        };
    }
}
