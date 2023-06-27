/// <reference types="react" />
interface BlestRequestState {
    loading: boolean;
    error: any;
    data: any;
}
interface BlestGlobalState {
    [id: string]: BlestRequestState;
}
type BlestSelector = Array<string | BlestSelector>;
type BlestQueueItem = [string, string, any?, BlestSelector?];
interface BlestContextValue {
    queue: BlestQueueItem[];
    state: BlestGlobalState;
    enqueue: any;
}
export declare const BlestProvider: ({ children, url, options }: {
    children: any;
    url: string;
    options?: any;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<BlestContextValue>>;
export declare const useBlestContext: () => BlestContextValue;
export declare const useBlestRequest: (route: string, parameters?: any, selector?: BlestSelector) => {};
export declare const useBlestCommand: (route: string, selector?: BlestSelector) => {}[];
export {};
