//@flow

test('runs basic flow', (done) => {
    const executeFlow = require('../src/executeFlow').default;

    const expectedItems = [];

    const observer = {
        onNext: (item) => {console.log(item)},
        onCompleted: () => done(),
        onError: (error) => {}
    }

    const flowExecution = function*() {
        
    }

    const flow = {
        name: "testFlow",
        steps: [],
        execution: flowExecution
    }
    executeFlow(flow)(observer)
});
