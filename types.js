//@flow
export type Flow = {
    name: string,
    cachedFlowCalls: Array<?FlowCall>,
    execution: () => Generator<FlowCall,*,*>,
    dependencies: *,
    dispose: ?Function
}

export type FlowCall = {
    type: "call",
    version: string,
    args: Array<mixed>,
    func: Function,
    result?: *
}

export type SaveFlow = (flow: Flow) => (void | Promise<void>);

export type Observer = {
    next: (item: *) => void,
    error: (error: Error) => void,
    complete: () => void
}
