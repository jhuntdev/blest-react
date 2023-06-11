# BLEST React

A React client for BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching and selective returns, and provides a modern alternative to REST.

To learn more about BLEST, please refer to the white paper: https://jhunt.dev/BLEST%20White%20Paper.pdf

## Features

- JSON Payloads - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save more bandwidth
- Selective Returns - Save even more bandwidth
- Single Endpoint - Reduce complexity and improve data privacy
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

```javascript
import React from 'react';
import { useBlestRequest, useBlestCommand } from 'blest-react';

// Use the useBlestRequest hook for fetching data
const MyComponent = () => {
  const { data, loading, error } = useBlestRequest('listItems', { limit: 24 });

  // Render your component
  // ...
};

// Use the useBlestCommand hook for sending data
const MyForm = () => {
  const [submitMyForm, { data, loading, error }] = useBlestCommand('submitForm');

  // Render your form
  // ...
};
```

## Contributing

We actively welcome pull requests. Learn how to [contribute](CONTRIBUTING.md) for more information.

## License

This project is licensed under the [MIT License](LICENSE).