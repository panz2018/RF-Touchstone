# React Example for rf-touchstone

[![React Example Tests](https://github.com/mjcaprani/rf-touchstone/actions/workflows/test-react-example.yml/badge.svg)](https://github.com/mjcaprani/rf-touchstone/actions/workflows/test-react-example.yml)
[![React Example Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#) <!-- Placeholder until actual coverage report URL is available -->

This example demonstrates how to use the `rf-touchstone` library in a simple React application built with Vite and TypeScript. It allows users to upload a Touchstone file (e.g., `.s1p`, `.s2p`) and view its parsed contents.

## Overview

The example consists of a single main component, `TouchstoneViewer`, which:
- Fetches and displays a default `sample.s2p` file on initial load.
- Allows users to upload their own Touchstone files.
- Uses `rf-touchstone` to parse the file content.
- Displays key information from the Touchstone file, such as type, frequency unit, parameters, format, resistance, comments, and network data in a table.
- Handles basic errors during file loading or parsing.

## Project Structure

- **`public/`**: Contains static assets, including the `sample.s2p` file.
- **`src/`**: Contains the React application code.
  - **`App.tsx`**: The main application component.
  - **`main.tsx`**: The entry point for the React application.
  - **`TouchstoneViewer.tsx`**: The component responsible for loading, parsing, and displaying Touchstone data.
  - **`*.css`**: Basic styling for the application.
- **`tests/`**: Contains test files for the application (using Vitest and React Testing Library).
- **`package.json`**: Defines project metadata, dependencies, and scripts.
- **`vite.config.ts`**: Vite configuration file, including Vitest setup.
- **`tsconfig.json`**: TypeScript configuration.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 22.x recommended)
- [Yarn](https://yarnpkg.com/) (version 4.x)

## Setup and Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/mjcaprani/rf-touchstone.git
    cd rf-touchstone/examples/react
    ```

2.  **Install dependencies using Yarn:**
    Ensure you are in the `examples/react` directory.
    ```bash
    yarn install
    ```
    This project uses Yarn 4.x with Plug'n'Play (PnP) for efficient dependency management.

## Available Scripts

In the `examples/react` directory, you can run the following scripts:

### `yarn dev`

Runs the app in development mode using Vite.
Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.
The page will reload if you make edits.

### `yarn build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `yarn test`

Runs the tests using Vitest in the `happy-dom` environment.

### `yarn test:watch`

Runs the tests in interactive watch mode.

### `yarn test:coverage`

Runs the tests and generates a coverage report in the `examples/react/coverage` directory. This example aims for 100% test coverage.

### `yarn lint`

Lints the codebase using ESLint to identify and fix problems in the TypeScript and TSX files.

### `yarn format`

Formats the code using Prettier.

## Using `rf-touchstone`

This example imports `rf-touchstone` directly from npm (as specified in its `package.json`). The `TouchstoneViewer.tsx` component utilizes `Touchstone.fromString()` method from the library to parse the string content of a Touchstone file:

```typescript
import { Touchstone } from 'rf-touchstone';

// Inside the component, when file content is available:
try {
  const fileTextContent = /* ... string content of the file ... */;
  const touchstoneInstance = Touchstone.fromString(fileTextContent);
  // Use touchstoneInstance to display data
} catch (error) {
  // Handle parsing errors
}
```

The parsed `touchstoneInstance` provides access to all data within the file, including metadata, comments, and the network parameters, which are then rendered by the React component.

## Contributing

Refer to the main repository's `DEVELOPMENT.md` for guidelines on contributing to the `rf-touchstone` project. For issues or suggestions specific to this React example, please open an issue on the GitHub repository.
