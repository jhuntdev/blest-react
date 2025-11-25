import { useState, useEffect, createContext, useContext, createElement, useRef, Fragment, useCallback } from 'react'
import isEqual from 'lodash/isEqual'

const idGenerator = (length: number = 8): string => {
  const max = Math.pow(16, length) - 1;
  const randomNumber = Math.floor(Math.random() * (max + 1));
  const id = randomNumber.toString(16).padStart(length, '0');
  return id;
}

interface BlestRequestState {
  loading: boolean;
  error: any;
  data: any;
}

interface BlestContextValue {
  client: HttpClient|null
}

export interface BlestProviderOptions {
  maxBatchSize?: number
  bufferDelay?: number
  httpHeaders?: { [key: string]: any }
  errorHandler?: (error: any, retry: () => void) => any
  idGenerator?: () => string
}

export type BlestSelector = Array<string|BlestSelector>

export interface BlestRequestOptions {
  skip?: boolean
  select?: BlestSelector
}

export interface BlestLazyRequestOptions {
  select?: BlestSelector
}

export class EventEmitter {
  runByEvent: any = {}

  add(event: string, cb: any, once: boolean = false) {
      if (!this.runByEvent[event]) this.runByEvent[event] = [];
      const node = {
          id: idGenerator(),
          event,
          cb,
          once
      }
      this.runByEvent[event].push(node)
  }

  remove(node: any) {
      this.runByEvent[node.event] = this.runByEvent[node.event].filter((n: any) => n.id !== node.id)
  }

  on(event: string, cb: any, once: boolean = false) {
      if(typeof cb != 'function') throw TypeError("Callback parameter has to be a function.");
      let node = this.add(event, cb, once);
      return () => this.remove(node);
  }

  once(event: string, cb: any) {
      return this.on(event, cb, true);
  }

  emit(event: string, ...data: any[]) {
      let nodes = this.runByEvent[event];
      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          node.cb(...data);
          if(node.once) {
              this.remove(node)
          }
      }
  }
}

const BlestContext = createContext<BlestContextValue>({ client: null })

export const BlestProvider = ({ children, url, options = {} }: { children: any, url: string, options?: BlestProviderOptions }) => {

  const safeOptions = useDeepMemo(options || {})
  const [client, setClient] = useState<HttpClient|null>(null)

  useEffect(() => {
    setClient(new HttpClient(url, safeOptions))
  }, [])

  useEffect(() => {
    client?.setOptions(safeOptions)
  }, [safeOptions])

  useEffect(() => {
    client?.setUrl(url)
  }, [url])

  return client ? createElement(BlestContext.Provider, { value: { client }}, children) : createElement(Fragment)

}

export interface ClientOptions extends BlestProviderOptions {}

class HttpClient {

    private url = '';
    private httpHeaders = {};
    private maxBatchSize = 25;
    private bufferDelay = 10;
    private queue: any[] = [];
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private emitter = new EventEmitter();
    private idGenerator: () => string = idGenerator;
    private errorHandler?: (error: any, retry: () => void) => void;

    public setOptions(options?: ClientOptions) {
      if (!options) {
        return false;
      } else if (typeof options !== 'object') {
        throw new Error('Options should be an object');
      } else {
        if (options.maxBatchSize) {
          if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
            throw new Error('"maxBatchSize" option should be an integer');
          } else if (options.maxBatchSize < 1) {
            throw new Error('"maxBatchSize" option should be greater than or equal to one');
          }
          this.maxBatchSize = options.maxBatchSize
        }
        if (options.bufferDelay) {
          if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
            throw new Error('"bufferDelay" option should be an integer');
          } else if (options.bufferDelay < 0) {
            throw new Error('"bufferDelay" option should be greater than or equal to zero');
          }
          this.bufferDelay = options.bufferDelay
        }
        if (options.httpHeaders) {
          if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
            throw new Error('"httpHeaders" option should be an object');
          }
          this.httpHeaders = options.httpHeaders
        }
        if (options.idGenerator) {
          if (typeof options.idGenerator !== 'function') {
            throw new Error('"idGenerator" option should be a function');
          }
          this.idGenerator = options.idGenerator
        }
        if (options.errorHandler) {
          if (typeof options.errorHandler !== 'function') {
            throw new Error('"errorHandler" option should be a function');
          }
          this.errorHandler = options.errorHandler
        }
      }
      return false;
    }

    public setUrl(url?:string) {
      if (url && typeof url === 'string') {
        this.url = url
      }
    }

    constructor(url: string, options?: ClientOptions) {
        this.url = url;
        this.setOptions(options);
    }

    private doHttpRequest = (queue: any[][], isRetry: boolean = false) => {
      httpPostRequest(this.url, queue, this.httpHeaders)
      .then(async (data: any) => {
          data.forEach((r: any) => {
              this.emitter.emit(r[0], r[2], r[3]);
          });
      })
      .catch(async (error: any) => {
        let skipEmit = false
        if (!isRetry && this.errorHandler) {
          await Promise.resolve(this.errorHandler(error, () => {
            skipEmit = true;
            this.retry(queue);
          })).catch(console.error);
        }
        if (!skipEmit) {
          queue.forEach((q) => {
            this.emitter.emit(q[0], null, error);
          });
        }
      });
    }

    private process() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
        if (!this.queue.length) {
            return
        }
        const copyQueue = this.queue.map((q) => [...q])
        this.queue = []
        const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize)
        for (let i = 0; i < batchCount; i++) {
            const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize)
            this.doHttpRequest(myQueue);
        }
    }

    public set(option: string, value: any) {
      if (typeof option !== 'string') throw new Error('Option name must be a string')
      this.setOptions({ [option]: value })
    }

    private retry(queue: any[][]) {
      this.doHttpRequest(queue, true);
    }

    public request(route: string, body: object | null, headers: object | null) {
        return new Promise((resolve, reject) => {
            if (!route) {
                return reject(new Error('Route is required'));
            } else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            } else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            const id = this.idGenerator();
            this.emitter.once(id, (result: any, error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
            this.queue.push([id, route, body || null, headers || null]);
            if (!this.timeout) {
                this.timeout = setTimeout(() => { this.process() }, this.bufferDelay);
            }
        });
    }
};

const httpPostRequest = async (url: string, data: any, httpHeaders: any = {}): Promise<any> => {
    const requestData = JSON.stringify(data);
    
    const options: RequestInit = {
        method: 'POST',
        body: requestData,
        mode: 'cors',
        headers: {
            ...httpHeaders,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    
    const response: Response = await fetch(url, options);

    if (!response.ok) throw new Error(`HTTP POST request failed with status code ${response.status}`);
    
    return await response.json();
}

interface BlestRequestHookReturn extends BlestRequestState {
  refresh: () => Promise<any>
}

const makeBlestHeaders = (options?: BlestRequestOptions|BlestLazyRequestOptions) => {
  const headers:any = {}
  if (!options) return headers;
  if (options.select && Array.isArray(options.select)) {
    headers._s = options.select
  }
  return headers
}

export const useBlestRequest = (route: string, body?: any, options?: BlestRequestOptions): BlestRequestHookReturn => {

  const safeBody = useDeepMemo(body);
  const safeOptions = useDeepMemo(options);
  const { client } = useContext(BlestContext);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const lastRequest = useRef<string>('');

  const request = useCallback(async () => {
    if (!client) throw new Error('Missing BLEST client in context');
    setLoading(true);
    try {
      const headers = makeBlestHeaders(safeOptions);
      const result = await client.request(route, safeBody, headers);
      setError(null);
      setData(result);
      setLoading(false);
      return data;
    } catch (error) {
      setData(null);
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [client, route, safeBody, safeOptions]);

  useEffect(() => {
    if (safeOptions?.skip) return;
    const requestHash = route + JSON.stringify(safeBody);
    if (!lastRequest.current || lastRequest.current !== requestHash) {
      lastRequest.current = requestHash;
      request().catch(console.error);
    }
  }, [client, route, safeBody, safeOptions]);

  return {
    loading,
    error,
    data,
    refresh: request
  }

}

export const useBlestLazyRequest = (route: string, options?: BlestLazyRequestOptions): [(body?: any) => Promise<any>, BlestRequestState] => {
  
  const safeOptions = useDeepMemo(options);
  const { client } = useContext(BlestContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  const request = useCallback(async (body?: any) => {
    if (!client) throw new Error('Missing BLEST client in context');
    setLoading(true);
    try {
      const headers = makeBlestHeaders(safeOptions);
      const result = await client.request(route, body, headers);
      setError(null);
      setData(result);
      setLoading(false);
      return data;
    } catch (error) {
      setData(null);
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [client, route, safeOptions]);

  return [request, { loading, error, data }];

}

export const useBlest = () => {
  const { client } = useContext(BlestContext);
  return { request: client?.request };
}

export const useRequest = useBlestRequest;
export const useLazyRequest = useBlestLazyRequest;

const useDeepMemo = (value: any): any => {
  const [safeValue, setSafeValue] = useState();

  if (!isEqual(value, safeValue)) {
    setSafeValue(value);
  }

  return safeValue;
}