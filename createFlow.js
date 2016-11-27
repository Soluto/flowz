export default (flowDescription, executions) => {
    if (flowDescription == null) return null;
    return {
        name: flowDescription.name,
        execution: executions[flowDescription.name],
        steps: flowDescription.steps || [],
    };
}