import { MutableRefObject } from 'react';
interface BlestRequestState {
    loading: boolean;
    error: any;
    data: any;
}
interface BlestGlobalState {
    [id: string]: BlestRequestState;
}
export type BlestSelector = Array<string | BlestSelector>;
type BlestQueueItem = [string, string, any?, BlestSelector?];
interface BlestContextValue {
    queue: MutableRefObject<BlestQueueItem[]>;
    state: BlestGlobalState;
    enqueue: any;
    ammend: any;
}
export interface BlestProviderOptions {
    maxBatchSize?: number;
    bufferDelay?: number;
    headers?: any;
}
export interface BlestRequestOptions {
    skip?: boolean;
    fetchMore?: any;
}
export interface BlestLazyRequestOptions {
    skip?: boolean;
    onComplete?: any;
}
export declare const BlestProvider: ({ children, url, options }: {
    children: any;
    url: string;
    options?: BlestProviderOptions | undefined;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<BlestContextValue>>;
export declare const useBlestContext: () => BlestContextValue;
export declare const useBlestRequest: (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions) => {
    fetchMore: (parameters?: any, mergeFunction?: any) => void;
    refresh: () => void;
    loading?: boolean | undefined;
    error?: any;
    data?: any;
};
export declare const useBlestLazyRequest: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => {}[];
export declare const useBlestCommand: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => {}[];
export declare const useLazyRequest: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => {}[];
export declare const useRequest: (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions) => {
    fetchMore: (parameters?: any, mergeFunction?: any) => void;
    refresh: () => void;
    loading?: boolean | undefined;
    error?: any;
    data?: any;
};
export declare const useCommand: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => {}[];
export {};
