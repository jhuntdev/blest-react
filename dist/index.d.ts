interface BlestRequestState {
    loading: boolean;
    error: any;
    data: any;
}
interface BlestContextValue {
    client: HttpClient | null;
}
export interface BlestProviderOptions {
    maxBatchSize?: number;
    bufferDelay?: number;
    httpHeaders?: {
        [key: string]: any;
    };
    errorHandler?: (error: any, retry: () => void) => any;
    idGenerator?: () => string;
}
export type BlestSelector = Array<string | BlestSelector>;
export interface BlestRequestOptions {
    skip?: boolean;
    select?: BlestSelector;
}
export interface BlestLazyRequestOptions {
    select?: BlestSelector;
}
export declare class EventEmitter {
    runByEvent: any;
    add(event: string, cb: any, once?: boolean): void;
    remove(node: any): void;
    on(event: string, cb: any, once?: boolean): () => void;
    once(event: string, cb: any): () => void;
    emit(event: string, ...data: any[]): void;
}
export declare const BlestProvider: ({ children, url, options }: {
    children: any;
    url: string;
    options?: BlestProviderOptions;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<BlestContextValue>> | import("react").FunctionComponentElement<import("react").FragmentProps>;
export interface ClientOptions extends BlestProviderOptions {
}
declare class HttpClient {
    private url;
    private httpHeaders;
    private maxBatchSize;
    private bufferDelay;
    private queue;
    private timeout;
    private emitter;
    private idGenerator;
    private errorHandler?;
    setOptions(options?: ClientOptions): boolean;
    setUrl(url?: string): void;
    constructor(url: string, options?: ClientOptions);
    private doHttpRequest;
    private process;
    set(option: string, value: any): void;
    private retry;
    request(route: string, body: object | null, headers: object | null): Promise<unknown>;
}
interface BlestRequestHookReturn extends BlestRequestState {
    refresh: () => Promise<any>;
}
export declare const useBlestRequest: (route: string, body?: any, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useBlestLazyRequest: (route: string, options?: BlestLazyRequestOptions) => [(body?: any) => Promise<any>, BlestRequestState];
export declare const useBlest: () => {
    request: ((route: string, body: object | null, headers: object | null) => Promise<unknown>) | undefined;
};
export declare const useRequest: (route: string, body?: any, options?: BlestRequestOptions) => BlestRequestHookReturn;
export declare const useLazyRequest: (route: string, options?: BlestLazyRequestOptions) => [(body?: any) => Promise<any>, BlestRequestState];
export {};
