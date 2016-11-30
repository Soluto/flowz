const flowify = require('../src/flowify').default;
const executeFlow = require('../src/executeFlow').default;

test('should execute empty flow', (passTestOnComplete) => {
    const observer = createObserver(passTestOnComplete)

    const flow = createFlow(function*() { })

    executeFlow(flow)(observer)
});

test('should execute flow with one message', (passTestOnComplete) => {
    const observer = createObserver(passTestOnComplete)

    const flow = createFlow(function*() {
        yield {foo: 1}
    })

    executeFlow(flow)(observer)
});

test("should executes flow with 'flow calls'", (done) => {
    const someFunction1 = flowify(() => "exepcted1");
    const someFunction2 = flowify(() => "exepcted2");

    const observer = {
        onNext: (result) => {
            expect(result.text).toBe("exepcted1_exepcted2")
            done();
        },
        onCompleted: () => {},
        onError: (error) => {}
    }

    const flow = createFlow(function*() {
        const result1 = yield someFunction1();
        const result2 = yield someFunction2();
        yield {text: result1 + "_" + result2};
    });

    executeFlow(flow)(observer)
});

test("should execute flow with cached steps", (done) => {
    const someFunction1 = flowify(() => "exepcted1");
    const someFunction2 = flowify(() => "exepcted2");

    const observer = {
        onNext: (result) => {
            expect(result.text).toBe("cachedResult1_exepcted2");
            done();
        },
        onCompleted: () => {},
        onError: (error) => {}
    }

    const flow = createFlow(function*() {
        const result1 = yield someFunction1();
        const result2 = yield someFunction2();
        yield {text: result1 + "_" + result2};
    }, [{type: "flowCall", result: "cachedResult1"}]);

    executeFlow(flow)(observer)
});

test("should abort flow excution", (done) => {
    const wait = flowify(() => wait(100));

    const observer = {
        onNext: (result) => {
            if (result.message === "aborted") {
                done();
            }
        },
        onCompleted: () => {},
        onError: (error) => {}
    }

    const flow = createFlow(function*() {
        yield wait();
    });

    const abortFlow = executeFlow(flow)(observer);
    abortFlow();
});

test('should execute completeFlow callback', (done) => {
    const observer = createObserver()

    const flow = createFlow(function*() { })

    const completeFlow = () => done();
    executeFlow(flow, null, completeFlow)(observer)
});

test("should execute commitFlow on 'flow call'", (done) => {
    const someFunction1 = flowify(() => "exepcted1");
    const observer = createObserver()

    const flow = createFlow(function*() {
        yield someFunction1();
    });

    const commitFlow = (flow) => {
        const results = flow.steps.map(s => s.result)
        console.log(results);
        expect(results[0]).toBe("exepcted1");
        done();
    };
    executeFlow(flow, commitFlow, null)(observer)
});

function wait(duration) {
    return new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve();
      }, duration)
    });
}

function createObserver(passOnComplete) {
    return {
        onNext: (item) => {},
        onCompleted: () => passOnComplete(),
        onError: (error) => {}
    }
}

function createFlow(flowExecution, steps) {
    return {
        name: "testFlow",
        steps: steps || [],
        execution: flowExecution
    }
}
