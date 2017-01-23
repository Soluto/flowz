import {executeFlow, send, call} from '../../src/index';
import {createObserver, createFlow} from '../utils';

describe("errors", () => {
  it("should catch thrown errors in flow execution", async () => {
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

  it("should catch Promise rejects in flow execution", async () => {
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

  it("should notify on error when Promise is rejected from flow 'call'", async () => {
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

  it("should notify on error when uncaught error is thrown from flow 'call'", async () => {
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
})
