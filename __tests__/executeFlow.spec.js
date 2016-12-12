import {executeFlow, send, call} from '../index';

test('should execute empty flow', (done) => {
    const observer = createObserver({complete: () => done()})
    const flow = createFlow(function*() { })
    executeFlow(flow)(observer)
});

test('should output objects from flow by calling "send" method', (done) => {
    const observer = createObserver({complete: () => done()})

    const flow = createFlow(function*() {
        send({foo: 1});
    })

    executeFlow(flow)(observer)
});

test("should executes flow 'call' without params", (done) => {
    const observer = createObserver({next: (item) => {
        expect(item.result).toBe("exepcted1")
        done();
    }})

    const flow = createFlow(function*() {
        const result = yield call(() => "exepcted1")();
        send({result});
    });

    executeFlow(flow)(observer)
});

test("should executes flow 'call' with params", (done) => {
    const flowCall = call((param) => param);

    const observer = createObserver({
        next: (item) => {
          expect(item.result).toBe("exepcted1")
          done();
        }
    })

    const flow = createFlow(function*() {
        const result = yield flowCall("exepcted1");
        send({result});
    });

    executeFlow(flow)(observer)
});

test("should executes flow 'call' with closure params", (done) => {
    const observer = createObserver({
        next: (item) => {
            expect(item.result).toBe(5)
            done();
        }
    })

    const flow = createFlow(function*() {
        const a = 4;
        const result = yield call(() => a + 1)();
        send({result});
    });

    executeFlow(flow)(observer)
});

test("should executes flow 'call' that run async method", (done) => {
    const observer = createObserver({next: (item) => {
        expect(item.result).toBe(5)
        done();
    }})

    const flow = createFlow(function*() {
        const result = yield call(() => Promise.resolve(5))();
        send({result});
    });

    executeFlow(flow)(observer)
});

test("should use result from flow 'call'", (done) => {
    const observer = createObserver({next: (item) => {
        expect(item.result).toBe("exepcted1_exepcted2")
        done();
    }})

    const flow = createFlow(function*() {
        const result1 = yield call(() => "exepcted1")();
        const result2 = yield call(() => result1 + "_exepcted2")();
        send({result: result2});
    });

    executeFlow(flow)(observer)
});

test("should execute flow with cached steps", (done) => {
    const observer = createObserver({next: (item) => {
        expect(item.result).toBe("cachedResult1_exepcted2")
        done();
    }})

    const flow = createFlow(function*() {
        const result1 = yield call(() => "exepcted1")();
        const result2 = yield call(() => "exepcted2")();
        send({result: result1 + "_" + result2});
    }, [{type: "method", result: "cachedResult1"}]);

    executeFlow(flow)(observer)
});

test("should execute a flow with inner generator", (done) => {
    const observer = createObserver({next: (item) => {
        expect(item.result).toBe(5)
        done();
    }})

    const innerGenerator = function*(param) {
        const result = yield call(() =>  param + 4)();
        send({result});
    }

    const flow = createFlow(function*() {
        const result = yield call(() => 1)()
        yield* innerGenerator(result);
    });

    executeFlow(flow)(observer);
});

test("should execute two flows parallely", (done) => {
    const results = [];

    const flow1 = createFlow(function*() {
        send({result: "exepcted1"});
        yield call(() => wait(10))();
        send({result: "exepcted3"});
    });
    const observer1 = createObserver({
        next: (item) => {
          results.push(item.result);
        },
        complete: () => {
            expect(results[0]).toBe("exepcted1");
            expect(results[1]).toBe("exepcted2");
            expect(results[2]).toBe("exepcted3");
            done();
        }
    });

    const flow2 = createFlow(function*() {
        send({result: "exepcted2"});
    });
    const observer2 = createObserver({next: (item) => {
        results.push(item.result);
    }});

    executeFlow(flow1)(observer1);
    executeFlow(flow2)(observer2);
});

test("should save flow synchronously", (done) => {
    let results = [];
    const observer = createObserver({
        complete: () => {
          expect(results[0]).toBe("exepcted1");
          done();
        }
    })

    const flow = createFlow(function*() {
        yield call(() => "exepcted1")();
    });

    const save = (flow) => {results = flow.cachedFlowCalls.map(m => m.result)};

    executeFlow(flow, save)(observer)
});

test("should save flow asynchronously", (done) => {
  let results = [];
  const observer = createObserver({
      complete: () => {
        expect(results[0]).toBe("exepcted1");
        done();
  }})

  const flow = createFlow(function*() {
      yield call(() => "exepcted1")();
  });

  const save = async (flow) => {
      await wait(100);
      results = flow.cachedFlowCalls.map(m => m.result)
  };

  executeFlow(flow, save)(observer)
});

test("should stop flow excution", async () => {
    const observer = createObserver()

    const flow = createFlow(function*() {
        yield call(() => 1)();
        yield call(() => 2)();
        yield call(() => 3)();
    });

    const stopFlowExecution = executeFlow(flow)(observer);
    const flowUntilStopped = stopFlowExecution();
    expect(flowUntilStopped.cachedFlowCalls.map(c => c.result)).toEqual([1,2,3]);
});

test("should stop flow excution when save is asynchronous", async () => {
    const observer = createObserver()

    const flow = createFlow(function*() {
        yield call(() => 1)();
        yield call(() => 2)();
        yield call(() => 3)();
    });

    const stopFlowExecution = executeFlow(flow, () => Promise.resolve())(observer);
    await wait(100)
    const flowUntilStopped = stopFlowExecution();
    expect(flowUntilStopped.cachedFlowCalls.map(c => c.result)).toEqual([1,2,3]);
});

test("should notify about error when yielding object with wrong type", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yield value type different than 'call'. type was: wrong. Did you wrap your function with 'call' method?")
        done();
    }})

    const flow = createFlow(function*() {
        yield {type: "wrong"};
    });

    executeFlow(flow)(observer)
});

test("should notify about error when yielding object that has no type", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yield value type different than 'call'. type was: undefined. Did you wrap your function with 'call' method?");
        done();
    }})

    const flow = createFlow(function*() {
        yield "stam"
    });

    executeFlow(flow)(observer)
});

test("should notify about error when yielding null", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yielded null value. Notice to yieled values must function wrap with 'call' method.")
        done();
    }})

    const flow = createFlow(function*() {
        yield null;
    });

    executeFlow(flow)(observer)
});

test('should notify about error when flow is null', (done) => {
    const observer = createObserver({error: () => done()})

    const flow = createFlow(null);

    executeFlow(flow)(observer)
});

test('should notify about error when no flow generator is null', (done) => {
    const observer = createObserver({error: () => done()})

    const flow = createFlow(null);

    executeFlow(flow)(observer)
});

test('should notify about error when flow has no name', (done) => {
    const observer = createObserver({error: () => done()})

    const flow = createFlow(null);

    executeFlow(flow)(observer)
});





function wait(duration) {
    return new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve();
      }, duration)
    });
}

function createObserver(observer = {}) {
    return {
        next: observer.next || ((item) => {}),
        complete: observer.complete || (() => {}),
        error: observer.error || ((error) => {console.log("error was thrown - " + error.message)})
    }
}

function createFlow(flowExecution, cachedFlowCalls) {
    return {
        name: "testFlow",
        cachedFlowCalls: cachedFlowCalls || [],
        execution: flowExecution
    }
}
