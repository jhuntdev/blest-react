import { useState, useEffect, useRef, createContext, useContext, useCallback, createElement } from 'react'
import { v4 as uuidv4 } from 'uuid'

const BlestContext = createContext()

export const BlestProvider = ({ children, url, options = {} }) => {

  const [queue, setQueue] = useState([])
  const [state, setState] = useState({})

  const timeout = useRef()

  const enqueue = useCallback((id, route, params, selector) => {
    if (timeout.current) clearTimeout(timeout.current)
    setState((state) => {
      return {
        ...state,
        [id]: {
          loading: false,
          error: null,
          data: null
        }
      }
    })
    setQueue((queue) => [...queue, [id, route, params, selector]])
  }, [])
  
  useEffect(() => {
    if (queue.length > 0) {
      const headers = options?.headers && typeof options?.headers === 'object' ? options.headers : {}
      const myQueue = queue.map((q) => [...q])
      const requestIds = queue.map((q) => q[0])
      setQueue([])
      timeout.current = setTimeout(() => {
        setState((state) => {
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
          setState((state) => {
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
          setState((state) => {
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

export const useBlestRequest = (route, params, selector) => {

  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState(null)
  const queryState = requestId && state[requestId]
  const lastRequest = useRef()

  useEffect(() => {
    const requestHash = route + JSON.stringify(params || {}) + JSON.stringify(selector || {})
    if (lastRequest.current !== requestHash) {
      lastRequest.current = requestHash
      const id = uuidv4()
      setRequestId(id)
      enqueue(id, route, params, selector)
    }
  }, [route, params, selector, enqueue])

  return queryState || {}

}

export const useBlestCommand = (route, selector) => {
  
  const { state, enqueue } = useContext(BlestContext)
  const [requestId, setRequestId] = useState(null)
  const queryState = requestId && state[requestId]

  const request = useCallback((params) => {
    const id = uuidv4()
    setRequestId(id)
    enqueue(id, route, params, selector)
  }, [route, selector, enqueue])

  return [request, queryState || {}]

}