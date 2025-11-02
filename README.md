# BLEST React

A React client for BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching by default, and provides a modern alternative to REST.

To learn more about BLEST, please visit the website: https://blest.jhunt.dev

## Features

- Built on JSON - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save even more bandwidth
- Single Endpoint - Reduce complexity and facilitate introspection
- Fully Encrypted - Improve data privacy

## Installation

Install BLEST React from npm

With npm:
```bash
npm install --save blest-react
```
or using yarn:
```bash
yarn add blest-react
```

## Usage

Wrap your app (or just part of it) with `BlestProvider`.

```javascript
import React from 'react'
import { BlestProvider } from 'blest-react'
import { uuidv9 } from 'uuid-v9'

const blestOptions = { // all optional
  maxBatchSize: 25,
  bufferDelay: 10,
  httpHeaders: { Authorization: 'Bearer token' }
  errorHandler: (error, retry) => {
    console.error(error)
    retry()
  }
  idGenerator: uuidv9
}

const App = () => {
  return (
    <BlestProvider
      url='http://localhost:8080'
      options={blestOptions}
    >
      {/* Your app here */}
    </BlestProvider>
  )
}
```

Use the `useBlestRequest` hook to perform passive requests on mount and when parameters change.

```javascript
import { useBlestRequest } from 'blest-react'

const MyComponent = () => {
  const { data, loading, error } = useBlestRequest(
    'listItems', // route
    { limit: 24 }, // body
    { select: ['edges', ['pageInfo', ['endCursor', 'hasNextPage']]] } // options
  )

  return (
    // Your component here
  )
}
```

Use the `useBlestLazyRequest` hook to generate a request function you can call when needed.

```javascript
import { useBlestLazyRequest } from 'blest-react'

const MyForm = () => {
  const [submitForm, { data, loading, error }] = useBlestLazyRequest(
    'submitForm', // route
    { select: ['success'] } // options
  )

  const handleSubmit = (values) => {
    submitForm(values)
  }

  return (
    // Your form here
  )
}
```

## License

This project is licensed under the [MIT License](LICENSE).