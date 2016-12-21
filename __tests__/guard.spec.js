import {executeFlow} from '../index';
import {createObserver, createFlow} from './utils';

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
    const success = new Promise((resolve) => {
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