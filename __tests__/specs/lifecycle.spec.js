import {executeFlow, call} from '../../index';
import {createObserver, createFlow, wait} from '../utils';

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