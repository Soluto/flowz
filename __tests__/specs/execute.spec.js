import {executeFlow, send, call} from '../../index';
import {createObserver, createFlow, wait} from '../utils';

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

test("should execute flow with dependencies that contains function", (done) => {
    const observer = createObserver();

    const dependency = (value) => value;
    const flow = createFlow(function*({dependency}) {
        const result = yield dependency(1);
        expect(result).toBe(1)
        done()
    }, null, {dependency});

    executeFlow(flow)(observer)
});

test("should execute flow with dependencies that contains non function'", (done) => {
    const observer = createObserver();

    const flow = createFlow(function*({dependency}) {
        expect(dependency).toBe("some value")
        done()
    }, null, {dependency: "some value"});

    executeFlow(flow)(observer)
});

test("should execute flow with multiple dependencies", (done) => {
    const observer = createObserver();

    const flow = createFlow(function*({dependency1, dependency2}) {
        expect(dependency1).toBe(1)
        expect( yield dependency2()).toBe(2)
        done()
    }, null, {dependency1: 1, dependency2: () => 2});

    executeFlow(flow)(observer)
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
    const results2 = new Promise((resolve) => {
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