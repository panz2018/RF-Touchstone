# Development for RF Touchstone

## Setup Node.js environment

### Download and install [Node.js](https://nodejs.org/en/download/package-manager) from the official website

### Check the current version of Node.js

```sh
node -v
```

### Install yarn

```sh
npm install --global yarn
```

### Install packages

```sh
yarn install
```

### Check for outdated packages

```sh
yarn outdated
```

### Upgrades packages

```sh
yarn upgrade --latest
```

## Setup Python environment

### Create and Use Virtual Environments

#### Create a new virtual environment

```sh
python -m venv .venv
```

#### Activate the virtual environment

On Windows:

```sh
.venv\Scripts\activate
```

On MacOS/Linux

```sh
source .venv/bin/activate
```

#### To confirm the virtual environment is activated, check the location of your Python interpreter:

```sh
where python
```

#### Check python version

```sh
python --version
```

#### Deactivate a virtual environment

On Windows:

```sh
.venv\Scripts\deactivate
```

### Install packages using pip

#### Update pip

```sh
python -m pip install --upgrade pip
```

#### Install packages using a requirements file

```sh
python -m pip install -r requirements.txt
```

#### Check packages available for update

```sh
pip list --outdated
```

## Development

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

### Format with [Prettier](https://prettier.io/)

```sh
yarn format
```

### Unit test with [Vitest](https://vitest.dev/)

#### Interactive development

```sh
yarn vitest
```

#### Command line

```sh
yarn test:unit
```

#### Check test coverage

```sh
yarn test:coverage
```

### All tests

Convenient command includes: lint, format, unit:test, test:coverage, build, and generate API docs

```sh
yarn test
```

### Compile, build and minify for production

```sh
yarn build
```

### Documentation (using [VitePress](https://vitepress.dev/) and [TypeDoc](https://typedoc.org/))

#### Generate API documentation from TSDoc comments

This command uses TypeDoc to parse TSDoc comments in the TypeScript source files and generates markdown files in the `docs/api` directory.

```sh
yarn docs:md
```

#### Start local development server for documentation

This command starts the VitePress development server. You can view your documentation site locally, usually at `http://localhost:5173`.

```sh
yarn docs:dev
```

#### Build documentation for deployment

This command builds the static HTML, CSS, and JavaScript files for the documentation site. The output will be in the `docs/.vitepress/dist` directory.

```sh
yarn docs:build
```

#### Preview the built documentation locally

After building the documentation, this command allows you to preview the production build locally before deploying it.

```sh
yarn docs:preview
```
