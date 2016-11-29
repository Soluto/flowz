//@flow
import type {FlowDescription} from './types';

export default (flowDescription: FlowDescription, executions: {[key:string]: Generator<*,void,*>}) => {
    if (flowDescription == null) return null;
    return {
        name: flowDescription.name,
        execution: executions[flowDescription.name],
        steps: flowDescription.steps || [],
    };
}
