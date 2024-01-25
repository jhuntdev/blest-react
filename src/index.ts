import { useState, useEffect, useRef, createContext, useContext, useCallback, createElement, MutableRefObject, useMemo, FC, ComponentClass } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface BlestRequestState {
  loading: boolean;
  error: any;
  data: any;
}

interface BlestGlobalState {
  [id: string]: BlestRequestState;
}

export type BlestSelector = Array<string | BlestSelector>

type BlestQueueItem = [string, string, any?, BlestSelector?]

interface BlestContextValue {
  queue: MutableRefObject<BlestQueueItem[]>,
  state: BlestGlobalState,
  enqueue: (id: string, route: string, parameters?: any, selector?: BlestSelector) => void
  ammend: (id: string, data: any) => void
}

export interface BlestProviderOptions {
  maxBatchSize?: number
  bufferDelay?: number
  headers?: any
}

export interface BlestRequestOptions {
  skip?: boolean
  fetchMore?: (parameters: any | null, mergeFunction: (oldData: any, newData: any) => any) => void
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

export const BlestProvider = ({ children, url, options = {} }: { children: any, url: string, options?: BlestProviderOptions }) => {

  const [state, setState] = useState<BlestGlobalState>({})
  const queue = useRef<BlestQueueItem[]>([])
  const timeout = useRef<number | null>(null)

  const enqueue = useCallback((id: string, route: string, parameters?: any, selector?: BlestSelector) => {
    const bufferDelay = options?.bufferDelay && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 5
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
    queue.current = [...queue.current, [id, route, parameters, selector]]
    if (!timeout.current) {
      timeout.current = setTimeout(process, bufferDelay)
    }
  }, [options])

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
    const maxBatchSize = options?.maxBatchSize && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25
    const headers = options?.headers && typeof options.headers === 'object' ? options.headers : {}
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
          ...headers,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
      .then(async (result) => {
        const results = await result.json()
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
      })
      .catch((error) => {
        setState((state: BlestGlobalState) => {
          const newState = {
            ...state
          }
          for (let i = 0; i < myQueue.length; i++) {
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
  }, [options])

  return createElement(BlestContext.Provider, { value: { queue, state, enqueue, ammend }}, children)

}

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
  fetchMore: (parameters: any | null, mergeFunction: (oldData: any, newData: any) => any) => Promise<any>,
  refresh: () => Promise<any>
}

export const useBlestRequest = (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions): BlestRequestHookReturn => {

  const { state, enqueue, ammend } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = useMemo(() => requestId && state[requestId], [requestId && state[requestId]])
  const lastRequest = useRef<string | null>(null)
  const allRequestIds = useRef<string[]>([])
  const doneRequestIds = useRef<string[]>([])
  const callbacksById = useRef<any>({})

  useEffect(() => {
    if (options?.skip) return;
    const requestHash = route + JSON.stringify(parameters || {}) + JSON.stringify(selector || {})
    if (lastRequest.current !== requestHash) {
      lastRequest.current = requestHash
      const id = uuidv4()
      setRequestId(id)
      allRequestIds.current = [...allRequestIds.current, id]
      enqueue(id, route, parameters, selector)
    }
  }, [route, parameters, selector, options])

  const fetchMore = useCallback((parameters: any | null, mergeFunction: (oldData: any, newData: any) => any) => {
    return new Promise((resolve, reject) => {
      if (!requestId) return reject()
      const id = uuidv4()
      allRequestIds.current = [...allRequestIds.current, id]
      callbacksById.current = {...callbacksById.current, [id]: mergeFunction}
      enqueue(id, route, parameters, selector)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else if (data) {
          resolve(data)
        }
      })
    })
  }, [route, requestId])

  const refresh = useCallback(() => {
    return new Promise((resolve, reject) => {
      const id = uuidv4()
      setRequestId(id)
      enqueue(id, route, parameters, selector)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
  }, [requestId, route, parameters, selector])

  useEffect(() => {
    if (!requestId) return;
    for (let i = 0; i < allRequestIds.current.length; i++) {
      const id = allRequestIds.current[i]
      if ((state[id]?.data || state[id]?.error) && doneRequestIds.current.indexOf(id) === -1) {
        doneRequestIds.current = [...doneRequestIds.current, id]
        if (state[id].data && typeof callbacksById.current[id] === 'function') {
          ammend(requestId, callbacksById.current[id](requestId ? state[requestId]?.data || {} : {}, state[id].data))
        }
      }
    }
  }, [state, options, requestId])

  return {
    ...(queryState || { loading: true, error: null, data: null }),
    fetchMore,
    refresh
  }

}

export const useBlestLazyRequest = (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions): [(parameters?: any) => Promise<any>, BlestRequestState] => {
  
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = useMemo(() => requestId && state[requestId], [requestId && state[requestId]])
  const allRequestIds = useRef<string[]>([])
  const doneRequestIds = useRef<string[]>([])

  const request = useCallback((parameters?: any) => {
    return new Promise((resolve, reject) => {
      if (options?.skip) return reject()
      const id = uuidv4()
      setRequestId(id)
      allRequestIds.current = [...allRequestIds.current, id]
      enqueue(id, route, parameters, selector)
      emitter.on(id, ({ data, error }) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
  }, [route, selector, options])

  useEffect(() => {
    for (let i = 0; i < allRequestIds.current.length; i++) {
      const id = allRequestIds.current[i]
      if ((state[id]?.data || state[id]?.error) && doneRequestIds.current.indexOf(id) === -1) {
        doneRequestIds.current = [...doneRequestIds.current, id]
        if (options?.onComplete && typeof options.onComplete === 'function') {
          // @ts-ignore
          options.onComplete(state[id].data, state[id].error)
        }
      }
    }
  }, [state, options])

  return [request, queryState || { loading: false, error: null, data: null }]

}

export const useRequest = useBlestRequest
export const useLazyRequest = useBlestLazyRequest
// export const useBlestCommand = useBlestLazyRequest
// export const useCommand = useBlestCommand
// export const useQuery = useBlestRequest
// export const useLazyQuery = useBlestLazyRequest