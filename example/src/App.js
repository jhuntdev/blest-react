import { useCallback, useEffect, useState } from 'react'
import { BlestProvider, useBlestLazyRequest, useBlestRequest } from 'blest-react'

function App() {
  return (
    <BlestProvider url='http://localhost:8080' options={{ httpHeaders: { 'Authorization': 'Bearer token' } }}>
      <div>
        <h1 style={{ marginTop: 0 }}>BLEST React Example</h1>
        <hr />
        <Component1 />
        <hr />
        <Component2 />
        <hr />
        <Component3 />
        <hr />
        <Component4 />
      </div>
    </BlestProvider>
  )
}

const Component1 = () => {
  const [count, setCount] = useState(0)
  const { data, error, loading, refresh } = useBlestRequest('hello')
  const handleClick = useCallback(() => {
    setCount((count) => count + 1)
    refresh().then(console.log.bind(null, 'refresh.then()')).catch(console.error.bind(null, 'refresh.catch()'))
  }, [refresh])
  return (
    <div>
      <h3>{`["hello", null]`}</h3>
      <p>{loading ? 'Loading...' : error ? 'Error: ' + error.message : JSON.stringify(data)}</p>
      {!loading && !error && <button onClick={handleClick}>Refresh ({count})</button>}
    </div>
  )
}

const Component2 = () => {
  const [name, setName] = useState('Steve')
  const [greet, { data, error, loading }] = useBlestLazyRequest('greet', { select: ['greeting'] })
  useEffect(() => {
    greet({ name }).then(console.log.bind(null, 'greet.then()')).catch(console.error.bind(null, 'greet.catch()'))
  }, [greet, name])
  return (
    <div>
      <h3>{`["greet", {"name": "`}<input type='text' value={name} onChange={(e) => setName(e.target.value)} />{`"}]`}</h3>
      <p>{loading ? 'Loading...' : error ? 'Error: ' + error.message : JSON.stringify(data)}</p>
    </div>
  )
}

const Component3 = () => {
  const { data, error, loading } = useBlestRequest('fail')
  return (
    <div>
      <h3>{`["fail"]`}</h3>
      <p>{loading ? 'Loading...' : error ? 'Error: ' + error.message : JSON.stringify(data)}</p>
    </div>
  )
}

const Component4 = () => {
  const { data, error, loading } = useBlestRequest('missing')
  return (
    <div>
      <h3>{`["missing"]`}</h3>
      <p>{loading ? 'Loading...' : error ? 'Error: ' + error.message : JSON.stringify(data)}</p>
    </div>
  )
}

export default App;