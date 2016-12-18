import {executeFlow, send, call} from '../index';

test('should complete flow', (done) => {
    const observer = createObserver({complete: () => done()})
    const flow = createFlow(function*() { })
    executeFlow(flow)(observer)
});

test('should output from flow by calling "send" method', async () => {
    let observer;
    const assertion = new Promise((resolve) => {
        const result = [];
        observer = createObserver({
            next: (item) => {
                result.push(item);
            },
            complete: () => resolve(result)
        });
    });

    const flow = createFlow(function*() {
        send({foo: 1});
        send("some output");
    })

    executeFlow(flow)(observer)
    expect((await assertion)).toEqual([{foo: 1}, "some output"]);
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

test("should executes async flow 'call'", (done) => {
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
        expect(item.result).toBe(5);
        done();
    }});

    const innerGenerator = function*(param) {
        const result = yield call(() =>  param + 4)();
        send({result});
    };

    const flow = createFlow(function*() {
        const result = yield call(() => 1)();
        yield* innerGenerator(result);
    });

    executeFlow(flow)(observer);
});

test("should catch thrown errors in flow execution", async () => {
    let observer;
    const assertion = new Promise((resolve) => {
        observer = createObserver({next: (item) => {
            resolve(item)
        }});
    });

    const flow = createFlow(function*() {
        try {
            yield call(() => {throw "some error"})();
        }
        catch (e) {
            expect(e).toBe("some error");
        }
        send({result: "expected"});
    });

    executeFlow(flow)(observer);
    expect(((await assertion).result)).toBe("expected");
});

test("should catch Promise rejects in flow execution", async () => {
    let observer;
    const assertion = new Promise((resolve) => {
        observer = createObserver({next: (item) => {
            resolve(item)
        }});
    });

    const flow = createFlow(function*() {
        try {
            yield call(() => Promise.reject("some error"))();
        }
        catch (e) {
            expect(e).toBe("some error");
        }
        send({result: "expected"});
    });

    executeFlow(flow)(observer);
    expect(((await assertion).result)).toBe("expected");
});

test("should notify on error when Promise is rejected from flow 'call'", async () => {
    let observer;
    const result = new Promise((resolve) => {
        observer = createObserver({error: (e) => resolve(e)});
    });

    const flow = createFlow(function*() {
        yield call(() => Promise.reject(new Error("some error")))();
    });

    executeFlow(flow)(observer);
    expect((await result).message).toBe("some error");
});

test("should notify on error when uncaught error is thrown from flow 'call'", async () => {
    let observer;
    const result = new Promise((resolve) => {
        observer = createObserver({error: (e) => resolve(e)});
    });

    const flow = createFlow(function*() {
        yield call(() => {throw new Error("some error")})();
    });

    executeFlow(flow)(observer);
    expect((await result).message).toBe("some error");
});

test("should execute two flows parallely", async () => {
    const flow1 = createFlow(function*() {
        send({result: "exepcted1"});
        yield call(() => wait(10))();
        send({result: "exepcted3"});
    });
    let observer1;
    let results1 = new Promise((resolve, reject) => {
        let results = [];
        observer1 = createObserver({
            next: (item) => {
                results.push(item.result);
            },
            complete: () => {
                resolve(results);
            }
        });
    });

    const flow2 = createFlow(function*() {
        send({result: "exepcted2"});
    });

    let observer2;
    const results2 = new Promise((resolve, reject) => {
        const results = [];
        observer2 = createObserver({
            next: (item) => {
                results.push(item.result);
            },
            complete: () => {
                resolve(results);
            }
        })
    });

    executeFlow(flow1)(observer1);
    executeFlow(flow2)(observer2);


    expect(await results1).toEqual(["exepcted1", "exepcted3"]);
    expect(await results2).toEqual(["exepcted2"])
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

test("should stop flow execution", async () => {
    const observer = createObserver();

    const flow = createFlow(function*() {
        yield call(() => 1)();
        yield call(() => 2)();
        yield call(() => 3)();
    });

    const flowInProgress = executeFlow(flow)(observer);
    flowInProgress.dispose();
    expect(flowInProgress.cachedFlowCalls.map(c => c.result)).toEqual([1,2,3]);
});

test("should stop flow execution when yielding asynchronous call", async () => {
    const observer = createObserver();

    const flow = createFlow(function*() {
        yield call(() => 1)();
        yield call(() => Promise.resolve())();
        yield call(() => 3)();
    });

    const flowInProgress = executeFlow(flow)(observer);
    flowInProgress.dispose();
    expect(flowInProgress.cachedFlowCalls.map(c => c.result)).toEqual([1]);
});

test("should stop flow execution when save is asynchronous", async () => {
    const observer = createObserver();

    const flow = createFlow(function*() {
        yield call(() => 1)();
        yield call(() => 2)();
        yield call(() => 3)();
    });

    const flowInProgress = executeFlow(flow, () => Promise.resolve())(observer);
    flowInProgress.dispose();
    expect(flowInProgress.cachedFlowCalls.map(c => c.result)).toEqual([1]);
});

test("should guard against yielding object with wrong type", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yield value type different than 'call'. type was: wrong. Did you wrap your function with 'call' method?")
        done();
    }});

    const flow = createFlow(function*() {
        yield {type: "wrong"};
    });

    executeFlow(flow)(observer)
});

test("should guard against yielding object that has no type", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yield value type different than 'call'. type was: undefined. Did you wrap your function with 'call' method?");
        done();
    }});

    const flow = createFlow(function*() {
        yield "stam"
    });

    executeFlow(flow)(observer)
});

test("should guard against yielding null", (done) => {
    const observer = createObserver({error: (item) => {
        expect(item.message).toBe("generator yielded null value. Notice to yieled values must function wrap with 'call' method.")
        done();
    }})

    const flow = createFlow(function*() {
        yield null;
    });

    executeFlow(flow)(observer)
});

test('should guard against null flow', async () => {
    let observer;
    const success = new Promise((resolve, reject) => {
        observer = createObserver({error: () => resolve(true)});
    });

    const flow = createFlow(null);

    executeFlow(flow)(observer)
    expect(await success).toBe(true);
});

test('should guard against flow without generator', (done) => {
    const observer = createObserver({error: () => done()})

    const flow = createFlow(null);

    executeFlow(flow)(observer)
});

test('should guard against flow without a name', (done) => {
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
