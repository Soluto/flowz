//@flow
import type {Flow} from './types';

export default (flow: Flow, executions: {[key:string]: Generator<*,void,*>}) => {
    return {
        name: flow.name,
        execution: executions[flow.name],
        cachedSteps: flow.cachedSteps || [],
    };
}
