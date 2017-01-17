export function wait(duration) {
    return new Promise(function(resolve){
        setTimeout(function(){
            resolve();
        }, duration)
    });
}

export function createObserver(observer = {}) {
    return {
        next: observer.next || ((item) => {}),
        complete: observer.complete || (() => {}),
        error: observer.error || ((error) => console.log("error was thrown - " + error.message))
    }
}

export function createFlow(flowExecution, steps, dependencies) {
    return {
        name: "testFlow",
        steps: steps,
        execution: flowExecution,
        dependencies
    }
}