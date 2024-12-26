import { MutableRefObject, FC, ComponentClass } from 'react';
interface BlestRequestState {
    loading: boolean;
    error: any;
    data: any;
}
interface BlestGlobalState {
    [id: string]: BlestRequestState;
}
type BlestQueueItem = [string, string, any?, any?];
interface BlestContextValue {
    queue: MutableRefObject<BlestQueueItem[]>;
    state: BlestGlobalState;
    enqueue: (id: string, route: string, body?: any, headers?: any) => void;
    ammend: (id: string, data: any) => void;
}
export interface BlestProviderOptions {
    maxBatchSize?: number;
    bufferDelay?: number;
    httpHeaders?: any;
}
export interface BlestRequestOptions {
    skip?: boolean;
}
export interface BlestLazyRequestOptions {
    skip?: boolean;
}
export declare const BlestProvider: import("react").MemoExoticComponent<({ children, url, options }: {
    children: any;
    url: string;
    options?: BlestProviderOptions;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<BlestContextValue>>>;
export declare const withBlest: (Component: FC | ComponentClass, url: string, options?: BlestProviderOptions) => (props?: any) => import("react").FunctionComponentElement<{
    children: any;
    url: string;
    options?: BlestProviderOptions;
}>;
export declare const useBlestContext: () => BlestContextValue;
interface BlestRequestHookReturn extends BlestRequestState {
    refresh: () => Promise<any>;
}
export declare const useBlestRequest: (route: string, body?: any, headers?: any, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useBlestLazyRequest: (route: string, headers?: any, options?: BlestLazyRequestOptions) => [(body?: any) => Promise<any>, BlestRequestState];
export declare const useRequest: (route: string, body?: any, headers?: any, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useLazyRequest: (route: string, headers?: any, options?: BlestLazyRequestOptions) => [(body?: any) => Promise<any>, BlestRequestState];
export {};
