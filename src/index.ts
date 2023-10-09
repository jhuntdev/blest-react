import { useState, useEffect, useRef, createContext, useContext, useCallback, createElement, MutableRefObject } from 'react'
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
  enqueue: any
  ammend: any
}

export interface BlestProviderOptions {
  maxBatchSize?: number
  bufferDelay?: number
  headers?: any
}

export interface BlestRequestOptions {
  skip?: boolean
  fetchMore?: any
}

export interface BlestLazyRequestOptions {
  skip?: boolean
  onComplete?: any
}

const BlestContext = createContext<BlestContextValue>({ queue: { current: [] }, state: {}, enqueue: () => {}, ammend: () => {} })

export const BlestProvider = ({ children, url, options = {} }: { children: any, url: string, options?: BlestProviderOptions }) => {

  const [state, setState] = useState<BlestGlobalState>({})
  const queue = useRef<BlestQueueItem[]>([])
  const timeout = useRef<number | null>(null)

  const maxBatchSize = options?.maxBatchSize && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25
  const bufferDelay = options?.bufferDelay && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 10
  const headers = options?.headers && typeof options.headers === 'object' ? options.headers : {}

  const enqueue = useCallback((id: string, route: string, parameters?: any, selector?: BlestSelector) => {
    setState((state: BlestGlobalState) => {
      return {
        ...state,
        [id]: {
          loading: false,
          error: null,
          data: null
        }
      }
    })
    queue.current = [...queue.current, [id, route, parameters, selector]]
    if (!timeout.current) {
      timeout.current = setTimeout(() => { process() }, bufferDelay)
    }
  }, [])

  const ammend = useCallback((id: string, data: any) => {
    setState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        data
      }
    }))
  }, [])

  const process = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      timeout.current = null
    }
    if (!queue.current.length) {
      return
    }
    const copyQueue: BlestQueueItem[] = queue.current.map((q: BlestQueueItem) => [...q])
    queue.current = []
    const batchCount = Math.ceil(copyQueue.length / maxBatchSize)
    for (let i = 0; i < batchCount; i++) {
      const myQueue = copyQueue.slice(i * maxBatchSize, (i + 1) * maxBatchSize)
      const requestIds = myQueue.map((q: BlestQueueItem) => q[0])
      setState((state: BlestGlobalState) => {
        const newState = {
          ...state
        }
        for (let i = 0; i < requestIds.length; i++) {
          const id = requestIds[i]
          newState[id] = {
            loading: true,
            error: null,
            data: null
          }
        }
        return newState
      })
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
            newState[id] = {
              loading: false,
              error: error,
              data: null
            }
          }
          return newState
        })
      })
    }
  }, [])

  return createElement(BlestContext.Provider, { value: { queue, state, enqueue, ammend }}, children)

}

export const useBlestContext = () => {

  const context = useContext(BlestContext)

  useEffect(() => {
    console.warn('useBlestContext() is a utility function for debugging')
  }, [])

  return context

}

export const useBlestRequest = (route: string, parameters?: any, selector?: BlestSelector, options?: BlestRequestOptions) => {

  const { state, enqueue, ammend } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = requestId && state[requestId]
  const lastRequest = useRef<string | null>(null)

  useEffect(() => {
    if (options?.skip) return;
    const requestHash = route + JSON.stringify(parameters || {}) + JSON.stringify(selector || {})
    if (lastRequest.current !== requestHash) {
      lastRequest.current = requestHash
      const id = uuidv4()
      setRequestId(id)
      enqueue(id, route, parameters, selector)
    }
  }, [route, parameters, selector, enqueue])

  const fetchMore = useCallback((parameters?: any, mergeFunction?: any) => {
    if (!requestId) return;
    const id = uuidv4()
    enqueue(id, route, parameters, selector)
    const fetchMoreInterval = setInterval(() => {
      if (state[id]?.data) {
        ammend(requestId, mergeFunction(state[requestId]?.data, state[id]?.data))
        clearInterval(fetchMoreInterval)
      }
    }, 1)
  }, [route, requestId])

  return {
    ...(queryState || {}),
    fetchMore
  }

}

export const useBlestLazyRequest = (route: string, selector?: BlestSelector, options?: BlestLazyRequestOptions) => {
  
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = requestId && state[requestId]

  const request = useCallback((parameters?: any) => {
    if (options?.skip) return;
    const id = uuidv4()
    setRequestId(id)
    enqueue(id, route, parameters, selector)
    if (options?.onComplete) {
      const onCompleteInterval = setInterval(() => {
        if (state[id]?.data || state[id]?.error) {
          options.onComplete(state[id]?.data, state[id]?.error)
          clearInterval(onCompleteInterval)
        }
      }, 1)
    }
  }, [route, selector, enqueue])

  return [request, queryState || {}]

}

export const useBlestCommand = useBlestLazyRequest
export const useLazyRequest = useBlestLazyRequest
export const useRequest = useBlestRequest
export const useCommand = useBlestCommand