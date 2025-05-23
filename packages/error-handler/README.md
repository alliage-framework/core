# Alliage Error Handler

A robust module for gracefully displaying exceptions in your Alliage applications.

## Overview

The Error Handler module captures uncaught exceptions and unhandled promises, displaying them with rich formatting and detailed context to simplify debugging.

## Installation

```bash
yarn add @alliage/error-handler
```

Or with npm:

```bash
npm install @alliage/error-handler
```

## Registration

### Using the Module Installer (Recommended)

If you have [@alliage/module-installer](../module-installer) already installed, simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/error-handler
```

### Manual Registration

Alternatively, update your `alliage-modules.json` file by adding this entry:

```json
{
  // ... other modules
  "@alliage/error-handler": {
    "module": "@alliage/error-handler",
    "deps": [],
    "envs": []
  }
}
```

## How It Works

Once installed and registered, the Error Handler works automatically without any additional configuration. It enhances error reporting by displaying:

- Error type (class name)
- Error message
- Complete stack trace
- Any custom properties added to the error object

## Creating Custom Errors

When developing Alliage modules, consider creating custom error classes with additional context to make debugging easier.

### JavaScript Example

```js
// customErrors.js
export class HttpError extends Error {
  constructor(status, body) {
    super('An HTTP error occurred');
    this.name = 'HttpError'; // Class name for better identification
    this.status = status;
    this.body = body;
  }
}

// Usage example
import { HttpError } from './customErrors.js';

// This error will be caught and displayed with the status and body properties
throw new HttpError(404, 'Resource not found');
```

### TypeScript Example

```ts
// customErrors.ts
export class HttpError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super('An HTTP error occurred');
    this.name = 'HttpError'; // Class name for better identification
    this.status = status;
    this.body = body;
  }
}

// Usage example
import { HttpError } from './customErrors.js';

// This error will be caught and displayed with the status and body properties
throw new HttpError(404, 'Resource not found');
```

## Error Display Format

When an uncaught error occurs, the Error Handler formats the output to clearly show all available information:

- The error type and message displayed with a red background
- All custom properties listed with their values
- Complete stack trace for identifying the error source

This makes debugging significantly easier, especially for complex applications with custom error types.
