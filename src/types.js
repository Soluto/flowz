//@flow
export type Flow = {
    name: string,
    cachedSteps: FlowStep[],
    execution?: () => Generator<FlowCall,*,*>
}

export type FlowStep = FlowMessage | FlowCall | FlowAbort

export type FlowMessage = {
    type: "flowMessage",
    payload: *
}

export type FlowCall = {
    type: "flowCall",
    name: string,
    id: string,
    args: Array<mixed>,
    func: Function,
    result:? *
}

export type FlowAbort = {
    type: "flowAbort",
    aborted: boolean
}

export type FlowError = {
    type: "flowError"
}

export type CommitFlow = (flow: Flow) => mixed;

export type CompleteFlow = (flow: Flow) => mixed;

export type Observer = {
    onNext: (item: FlowMessage | FlowAbort) => mixed,
    onError: (error: FlowError) => mixed,
    onCompleted: () => mixed
}
