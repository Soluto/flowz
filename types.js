//@flow
export type FlowCall = {
    type: "flowCall",
    name: string,
    id: string,
    args: Array<mixed>,
    func: Function
}

export type FlowMessage = {
    type: "message",
    message: mixed
}

export type FlowCallResult = FlowCall | {result: mixed}

export type FlowStep = FlowMessage | FlowCallResult

export type Flow = {
    steps: Array<FlowStep>,
    execution: () => Generator<*,*,*>
}

export type CommitFlow = (flow: Flow) => mixed;

export type CompleteFlow = (flow: Flow) => mixed;

export type Observer<T> = {
    onNext: (value: T) => mixed,
    onError: (error: any) => mixed,
    onCompleted: () => mixed
}