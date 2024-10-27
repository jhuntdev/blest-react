import { useState, useEffect, useRef, createContext, useContext, useCallback, createElement, MutableRefObject, FC, ComponentClass, memo } from 'react'
import { v1 as uuid } from 'uuid'
import isEqual from 'lodash/isEqual'

interface BlestRequestState {
  loading: boolean;
  error: any;
  data: any;
}

interface BlestGlobalState {
  [id: string]: BlestRequestState;
}

type BlestQueueItem = [string, string, any?, any?]

interface BlestContextValue {
  queue: MutableRefObject<BlestQueueItem[]>,
  state: BlestGlobalState,
  enqueue: (id: string, route: string, body?: any, headers?: any) => void
  ammend: (id: string, data: any) => void
}

export interface BlestProviderOptions {
  maxBatchSize?: number
  bufferDelay?: number
  httpHeaders?: any
}

export interface BlestRequestOptions {
  skip?: boolean
  fetchMore?: (body: any | null, mergeFunction: (oldData: any, newData: any) => any) => void
}

export interface BlestLazyRequestOptions {
  skip?: boolean
  onComplete?: (data: any, error: any) => void
}

type EventHandler<T> = (data: T) => void

class EventEmitter<T> {
  private events: { [key: string]: EventHandler<T>[] } = {}

  on(eventName: string, handler: EventHandler<T>): void {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(handler)
  }

  off(eventName: string, handler: EventHandler<T>): void {
    const eventHandlers = this.events[eventName]
    if (eventHandlers) {
      this.events[eventName] = eventHandlers.filter((h) => h !== handler)
    }
  }

  emit(eventName: string, data: T): void {
    const eventHandlers = this.events[eventName]
    if (eventHandlers) {
      eventHandlers.forEach((handler) => handler(data))
    }
  }
}

const emitter = new EventEmitter<any>();

const BlestContext = createContext<BlestContextValue>({ queue: { current: [] }, state: {}, enqueue: () => {}, ammend: () => {} })

export const BlestProvider = memo(({ children, url, options = {} }: { children: any, url: string, options?: BlestProviderOptions }) => {

  // const safeOptions = useDeepMemo(options)
  const [state, setState] = useState<BlestGlobalState>({})
  const queue = useRef<BlestQueueItem[]>([])
  const timeout = useRef<number | null>(null)
  const httpHeaders = useDeepMemo(options.httpHeaders === 'object' ? options.httpHeaders : {})
  // httpHeaders.current = options?.httpHeaders && typeof options.httpHeaders === 'object' ? options.httpHeaders : {}
  const bufferDelay = options?.bufferDelay && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 5
  const maxBatchSize = options?.maxBatchSize && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25

  const enqueue = useCallback((id: string, route: string, body?: any, headers?: any) => {
    // const bufferDelay = options?.bufferDelay && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 5
    setState((state: BlestGlobalState) => {
      return {
        ...state,
        [id]: {
          loading: true,
          error: null,
          data: null
        }
      }
    })
    queue.current = [...queue.current, [id, route, body, headers]]
    if (!timeout.current) {
      timeout.current = setTimeout(process, bufferDelay)
    }
  }, [])

  const ammend = useCallback((id: string, data: any) => {
    setState((state:BlestGlobalState) => {
      const newState = {
        ...state,
        [id]: {
          ...state[id],
          data
        }
      }
      return newState
    })
  }, [])

  const process = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      timeout.current = null
    }
    if (!queue.current.length) {
      return
    }
    // const maxBatchSize = options?.maxBatchSize && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25
    // const headers = options?.headers && typeof options.headers === 'object' ? options.headers : {}
    const copyQueue: BlestQueueItem[] = [...queue.current] // .map((q: BlestQueueItem) => [...q])
    queue.current = []
    const batchCount = Math.ceil(copyQueue.length / maxBatchSize)
    for (let i = 0; i < batchCount; i++) {
      const myQueue = copyQueue.slice(i * maxBatchSize, (i + 1) * maxBatchSize)
      const requestIds = myQueue.map((q: BlestQueueItem) => q[0])
      fetch(url, {
        body: JSON.stringify(myQueue),
        mode: 'cors',
        method: 'POST',
        headers: {
          ...httpHeaders,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
      .then(async (response) => {
        const results = await response.json()
        if (response.ok) {
          setState((state: BlestGlobalState) => {
            const newState = {
              ...state
            }
            for (let i = 0; i < results.length; i++) {
              const item = results[i]
              emitter.emit(item[0], { data: item[2], error: item[3] })
              newState[item[0]] = {
                loading: false,
                error: item[3],
                data: item[2]
              }
            }
            return newState
          })
        } else {
          const error = results || { status: response.status, message: response.statusText || 'Network error' } 
          setState((state: BlestGlobalState) => {
            const newState = {
              ...state
            }
            for (let i = 0; i < requestIds.length; i++) {
              const id = requestIds[i]
              emitter.emit(id, { data: null, error })
              newState[id] = {
                loading: false,
                error,
                data: null
              }
            }
            return newState
          })
        }
      })
      .catch((error):void => {
        setState((state: BlestGlobalState) => {
          const newState = {
            ...state
          }
          for (let i = 0; i < requestIds.length; i++) {
            const id = requestIds[i]
            emitter.emit(id, { data: null, error })
            newState[id] = {
              loading: false,
              error,
              data: null
            }
          }
          return newState
        })
      })
    }
  }, [httpHeaders, maxBatchSize, bufferDelay])

  return createElement(BlestContext.Provider, { value: { queue, state, enqueue, ammend }}, children)

}, (oldProps, newProps) => {
  return oldProps.url === newProps.url && isEqual(oldProps.options, newProps.options) && isEqual(oldProps.children, newProps.children)
})

export const withBlest = (Component: FC | ComponentClass, url: string, options?: BlestProviderOptions) => {
  return (props?: any) => createElement(BlestProvider, { url, options, children: createElement(Component, props) })
}

export const useBlestContext = () => {

  const context = useContext(BlestContext)

  useEffect(() => {
    console.warn('useBlestContext() is a utility function for debugging')
  }, [])

  return context

}

interface BlestRequestHookReturn extends BlestRequestState {
  fetchMore: (body: any | null, mergeFunction: (oldData: any, newData: any) => any) => Promise<any>,
  refresh: () => Promise<any>
}

export const useBlestRequest = (route: string, body?: any, headers?: any, options?: BlestRequestOptions): BlestRequestHookReturn => {

  const safeBody = useDeepMemo(body)
  const safeHeaders = useDeepMemo(headers)
  const safeOptions = useDeepMemo(options)
  const { state, enqueue, ammend } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const requestState = useDeepMemo(requestId && state[requestId])
  // useMemo(() => requestId && state[requestId], [requestId && JSON.stringify(state[requestId])])
  const lastRequest = useRef<string | null>(null)
  const allRequestIds = useRef<string[]>([])
  const doneRequestIds = useRef<string[]>([])
  const callbacksById = useRef<any>({})

  useEffect(() => {
    if (safeOptions?.skip) return;
    const requestHash = route + JSON.stringify(safeBody || {}) + JSON.stringify(safeHeaders || {}) + JSON.stringify(safeOptions || {})
    if (lastRequest.current !== requestHash) {
      lastRequest.current = requestHash
      const id = uuid()
      setRequestId(id)
      allRequestIds.current = [...allRequestIds.current, id]
      enqueue(id, route, safeBody, safeHeaders)
    }
  }, [route, safeBody, safeHeaders, safeOptions])

  const fetchMore = (body: any | null, mergeFunction: (oldData: any, newData: any) => any) => {
    return new Promise((resolve, reject) => {
      if (
        (safeOptions && safeOptions.skip) ||
        !requestId ||
        doneRequestIds.current.indexOf(requestId) === -1
      ) return resolve(null)
      const id = uuid()
      allRequestIds.current = [...allRequestIds.current, id]
      callbacksById.current = {...callbacksById.current, [id]: mergeFunction}
      enqueue(id, route, body, safeHeaders)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else if (data) {
          resolve(data)
        }
      })
    })
  }

  const refresh = () => {
    return new Promise((resolve, reject) => {
      if (
        (safeOptions && safeOptions.skip) ||
        !requestId ||
        doneRequestIds.current.indexOf(requestId) === -1
      ) return resolve(null)
      const id = uuid()
      setRequestId(id)
      enqueue(id, route, safeBody, safeHeaders)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
  }

  useEffect(() => {
    if (!requestId) return;
    for (let i = 0; i < allRequestIds.current.length; i++) {
      const id = allRequestIds.current[i]
      if (state[id] && (state[id].data || state[id].error) && doneRequestIds.current.indexOf(id) === -1) {
        doneRequestIds.current = [...doneRequestIds.current, id]
        if (state[id].data && typeof callbacksById.current[id] === 'function') {
          ammend(requestId, callbacksById.current[id](requestId ? state[requestId]?.data || {} : {}, state[id].data))
        }
      }
    }
  }, [requestState, requestId])

  return {
    ...(requestState || { loading: true, error: null, data: null }),
    fetchMore,
    refresh
  }

}

export const useBlestLazyRequest = (route: string, headers?: any, options?: BlestLazyRequestOptions): [(body?: any) => Promise<any>, BlestRequestState] => {
  
  const safeHeaders = useDeepMemo(headers)
  const safeOptions = useDeepMemo(options)
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const requestState = useDeepMemo(requestId && state[requestId])
  // useMemo(() => requestId && state[requestId], [requestId && state[requestId]])
  const allRequestIds = useRef<string[]>([])
  const doneRequestIds = useRef<string[]>([])

  const request = useCallback((body?: any) => {
    return new Promise((resolve, reject) => {
      if (safeOptions?.skip) return reject()
      const id = uuid()
      setRequestId(id)
      allRequestIds.current = [...allRequestIds.current, id]
      enqueue(id, route, body, safeHeaders)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
  }, [enqueue, route, safeHeaders, safeOptions])

  useEffect(() => {
    for (let i = 0; i < allRequestIds.current.length; i++) {
      const id = allRequestIds.current[i]
      if (state[id] && (state[id].data || state[id].error) && doneRequestIds.current.indexOf(id) === -1) {
        doneRequestIds.current = [...doneRequestIds.current, id]
        if (safeOptions && safeOptions.onComplete && typeof safeOptions.onComplete === 'function') {
          safeOptions.onComplete(state[id].data, state[id].error)
        }
      }
    }
  }, [requestState, safeOptions])

  return [request, requestState || { loading: false, error: null, data: null }]

}

export const useRequest = useBlestRequest
export const useLazyRequest = useBlestLazyRequest

const useDeepMemo = (value: any): any => {
  const [safeValue, setSafeValue] = useState()

  if (!isEqual(value, safeValue)) {
    console.log('useDeepMemo', value, safeValue)
    setSafeValue(value)
  }

  return safeValue
}