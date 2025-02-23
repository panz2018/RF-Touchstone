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

```
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

### Generate API docs

```sh
yarn docs
```
