//@flow
export type FlowCall = {
    type: "flowCall",
    name: string,
    id: string,
    args: Array<mixed>,
    func: Function
}

export type FlowDescription = {
    name: string,
    steps: Array<FlowStep>
}

export type FlowMessage = {
    type: "message",
    message: *
}

export type FlowCallResult = FlowCall & {result: mixed}

export type FlowStep = FlowMessage | FlowCallResult

export type Flow = {
    name: string,
    steps: FlowStep[],
    execution: () => Generator<FlowCall,*,*>
}

export type CommitFlow = (flow: Flow) => mixed;

export type CompleteFlow = (flow: Flow) => mixed;

export type Observer<T> = {
    onNext: (value: T) => *,
    onError: (error: any) => mixed,
    onCompleted: () => mixed
}
