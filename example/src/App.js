import { useEffect, useState } from 'react'
import { BlestProvider, useBlestLazyRequest, useBlestRequest } from 'blest-react'

function App() {
  return (
    <BlestProvider url='http://localhost:8080'>
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
  const { data, error, loading, fetchMore } = useBlestRequest('hello', null, ['hello'])
  const handleClick = () => {
    fetchMore(
      null,
      (oldData, newData) => {
        return { ...newData, count: oldData?.count ? oldData.count + 1 : 1 }
      }
    ).then(console.log.bind(null, 'fetchMore.then()')).catch(console.error.bind(null, 'fetchMore.catch()'))
  }
  return (
    <div>
      <h3>{`["hello", null, ["hello"]]`}</h3>
      <p>{loading ? 'Loading...' : error ? 'Error: ' + error.message : JSON.stringify(data)}</p>
      {!loading && !error && <button onClick={handleClick}>Fetch More ({data?.count || 0})</button>}
    </div>
  )
}

const Component2 = () => {
  const [name, setName] = useState('Steve')
  const [greet, { data, error, loading }] = useBlestLazyRequest('greet', null)
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