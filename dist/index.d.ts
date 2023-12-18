import { MutableRefObject, FC, ComponentClass } from 'react';
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
    enqueue: (id: string, route: string, parameters?: any, selector?: BlestSelector) => void;
    ammend: (id: string, data: any) => void;
}
export interface BlestProviderOptions {
    maxBatchSize?: number;
    bufferDelay?: number;
    headers?: any;
}
export interface BlestRequestOptions {
    skip?: boolean;
    fetchMore?: (parameters: any | null, mergeFunction: (oldData: any, newData: any) => any) => void;
}
export interface BlestLazyRequestOptions {
    skip?: boolean;
    onComplete?: (data: any, error: any) => void;
}
export declare const BlestProvider: ({ children, url, options }: {
    children: any;
    url: string;
    options?: BlestProviderOptions | undefined;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<BlestContextValue>>;
export declare const withBlest: (Component: FC | ComponentClass, url: string, options?: BlestProviderOptions) => (props?: any) => import("react").FunctionComponentElement<{
    children: any;
    url: string;
    options?: BlestProviderOptions | undefined;
}>;
export declare const useBlestContext: () => BlestContextValue;
interface BlestRequestHookReturn extends BlestRequestState {
    fetchMore: (parameters: any | null, mergeFunction: (oldData: any, newData: any) => any) => Promise<any>;
    refresh: () => Promise<any>;
}
export declare const useBlestRequest: (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useBlestLazyRequest: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => [(parameters?: any) => Promise<any>, BlestRequestState];
export declare const useRequest: (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useLazyRequest: (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => [(parameters?: any) => Promise<any>, BlestRequestState];
export {};
