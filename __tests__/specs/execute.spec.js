import { executeFlow, send, call } from '../../src/index';
import { createObserver, createFlow, wait } from '../utils';

describe("execute", () => {
    it('should complete flow', (done) => {
        const observer = createObserver({ complete: () => done() })
        const flow = createFlow(function* () { })
        executeFlow(flow)(observer)
    });

    it('should output from flow by calling "send" method', async () => {
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

        const flow = createFlow(function* () {
            send({ foo: 1 });
            send("some output");
        })

        executeFlow(flow)(observer)
        expect((await assertion)).toEqual([{ foo: 1 }, "some output"]);
    });

    it("should executes flow 'call' without params", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe("exepcted1")
                done();
            }
        })

        const flow = createFlow(function* () {
            const result = yield call(() => "exepcted1")();
            send({ result });
        });

        executeFlow(flow)(observer)
    });

    it("should executes flow 'call' with params", (done) => {
        const flowCall = call((param) => param);

        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe("exepcted1")
                done();
            }
        })

        const flow = createFlow(function* () {
            const result = yield flowCall("exepcted1");
            send({ result });
        });

        executeFlow(flow)(observer)
    });

    it("should executes flow 'call' with closure params", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe(5)
                done();
            }
        })

        const flow = createFlow(function* () {
            const a = 4;
            const result = yield call(() => a + 1)();
            send({ result });
        });

        executeFlow(flow)(observer)
    });

    it("should wrap object functions with 'call'", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result1).toBe(5)
                expect(item.result2).toBe(6)
                done();
            }
        })

        const flow = createFlow(function* () {
            let obj = {
                prop: "some string",
                func1: (a) => a + 1,
                func2: (a) => a + 2
            }
            obj = call.wrap(obj);
            expect(obj.prop).toBe("some string");

            const a = 4;
            const result1 = yield obj.func1(a)
            const result2 = yield obj.func2(a)
            send({ result1, result2 });
        });

        executeFlow(flow)(observer)
    });

    it("should executes async flow 'call'", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe(5)
                done();
            }
        })

        const flow = createFlow(function* () {
            const result = yield call(() => Promise.resolve(5))();
            send({ result });
        });

        executeFlow(flow)(observer)
    });

    it("should use result from flow 'call'", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe("exepcted1_exepcted2")
                done();
            }
        })

        const flow = createFlow(function* () {
            const result1 = yield call(() => "exepcted1")();
            const result2 = yield call(() => result1 + "_exepcted2")();
            send({ result: result2 });
        });

        executeFlow(flow)(observer)
    });

    it("should execute flow with single cached step", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe("cachedResult1")
                done();
            }
        })

        const flow = createFlow(function* () {
            const result1 = yield call(() => "exepcted1")();
            send({ result: result1 });
        }, [{ type: "call", result: "cachedResult1" }]);

        executeFlow(flow)(observer)
    });

    it("should execute flow with multiple cached steps", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe("cachedResult1_exepcted2")
                done();
            }
        })

        const flow = createFlow(function* () {
            const result1 = yield call(() => "exepcted1")();
            const result2 = yield call(() => "exepcted2")();
            send({ result: result1 + "_" + result2 });
        }, [{ type: "call", result: "cachedResult1" }]);

        executeFlow(flow)(observer)
    });

    it("should execute a flow with inner generator", (done) => {
        const observer = createObserver({
            next: (item) => {
                expect(item.result).toBe(5);
                done();
            }
        });

        const innerGenerator = function* (param) {
            const result = yield call(() => param + 4)();
            send({ result });
        };

        const flow = createFlow(function* () {
            const result = yield call(() => 1)();
            yield* innerGenerator(result);
        });

        executeFlow(flow)(observer);
    });

    it("should execute flow with dependencies that contains function", (done) => {
        const observer = createObserver();

        const dependency = (value) => value;
        const flow = createFlow(function* ({dependency}) {
            const result = yield dependency(1);
            expect(result).toBe(1)
            done()
        }, null, { dependency });

        executeFlow(flow)(observer)
    });

    it("should execute flow with dependencies that contains non function'", (done) => {
        const observer = createObserver();

        const flow = createFlow(function* ({dependency}) {
            expect(dependency).toBe("some value")
            done()
        }, null, { dependency: "some value" });

        executeFlow(flow)(observer)
    });

    it("should execute flow with multiple dependencies", (done) => {
        const observer = createObserver();

        const flow = createFlow(function* ({dependency1, dependency2}) {
            expect(dependency1).toBe(1)
            expect(yield dependency2()).toBe(2)
            done()
        }, null, { dependency1: 1, dependency2: () => 2 });

        executeFlow(flow)(observer)
    });

    it("should execute two flows parallely", async () => {
        const flow1 = createFlow(function* () {
            send({ result: "exepcted1" });
            yield call(() => wait(10))();
            send({ result: "exepcted3" });
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

        const flow2 = createFlow(function* () {
            send({ result: "exepcted2" });
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

    it("should stop flow execution", async () => {
        const observer = createObserver();

        const flow = createFlow(function* () {
            yield call(() => 1)();
            yield call(() => 2)();
            yield call(() => 3)();
        });

        const flowInProgress = executeFlow(flow)(observer);
        flowInProgress.dispose();
        expect(flowInProgress.steps.map(c => c.result)).toEqual([1, 2, 3]);
    });

    it("should stop flow execution when yielding asynchronous call", async () => {
        const observer = createObserver();

        const flow = createFlow(function* () {
            yield call(() => 1)();
            yield call(() => Promise.resolve())();
            yield call(() => 3)();
        });

        const flowInProgress = executeFlow(flow)(observer);
        flowInProgress.dispose();
        expect(flowInProgress.steps.map(c => c.result)).toEqual([1]);
    });
})