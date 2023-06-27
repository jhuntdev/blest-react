import { useState, useEffect, useRef, createContext, useContext, useCallback, createElement } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface BlestRequestState {
  loading: boolean;
  error: any;
  data: any;
}

interface BlestGlobalState {
  [id: string]: BlestRequestState;
}

type BlestSelector = Array<string | BlestSelector>

type BlestQueueItem = [string, string, any?, BlestSelector?]

interface BlestContextValue {
  queue: BlestQueueItem[],
  state: BlestGlobalState,
  enqueue: any
}

const BlestContext = createContext<BlestContextValue>({ queue: [], state: {}, enqueue: () => {} })

export const BlestProvider = ({ children, url, options = {} }: { children: any, url: string, options?: any }) => {

  const [queue, setQueue] = useState<BlestQueueItem[]>([])
  const [state, setState] = useState<BlestGlobalState>({})

  const timeout = useRef<number | null>(null)

  const enqueue = useCallback((id: string, route: string, params?: any, selector?: BlestSelector) => {
    if (timeout.current) clearTimeout(timeout.current)
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
    setQueue((queue: BlestQueueItem[]) => [...queue, [id, route, params, selector]])
  }, [])
  
  useEffect(() => {
    if (queue.length > 0) {
      const headers = options?.headers && typeof options?.headers === 'object' ? options.headers : {}
      const myQueue = queue.map((q: BlestQueueItem) => [...q])
      const requestIds = queue.map((q: BlestQueueItem) => q[0])
      setQueue([])
      timeout.current = setTimeout(() => {
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
      }, 1)
    }
  }, [queue, url, options])

  return createElement(BlestContext.Provider, { value: { queue, state, enqueue }}, children)

}

export const useBlestContext = () => {

  const context = useContext(BlestContext)

  useEffect(() => {
    console.warn('useBlestContext() is a utility function for debugging')
  }, [])

  return context

}

export const useBlestRequest = (route: string, parameters?: any, selector?: BlestSelector) => {

  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = requestId && state[requestId]
  const lastRequest = useRef<string | null>(null)

  useEffect(() => {
    const requestHash = route + JSON.stringify(parameters || {}) + JSON.stringify(selector || {})
    if (lastRequest.current !== requestHash) {
      lastRequest.current = requestHash
      const id = uuidv4()
      setRequestId(id)
      enqueue(id, route, parameters, selector)
    }
  }, [route, parameters, selector, enqueue])

  return queryState || {}

}

export const useBlestCommand = (route: string, selector?: BlestSelector) => {
  
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState<string | null>(null)
  const queryState = requestId && state[requestId]

  const request = useCallback((parameters?: any) => {
    const id = uuidv4()
    setRequestId(id)
    enqueue(id, route, parameters, selector)
  }, [route, selector, enqueue])

  return [request, queryState || {}]

}