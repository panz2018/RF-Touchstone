# Development for RF Touchstone

## Setup Node.js environment

### Download and install [Node.js](https://nodejs.org/en/download/package-manager) from the official website

### Check the current version of Node.js

```sh
node -v
```

### Install yarn

```sh
yarn set version stable
```

### Check the current version of yarn

```sh
yarn -v
```

### Install packages

```sh
yarn
```

### Check for outdated packages, and upgrade packages

```sh
yarn upgrade-interactive
```

## Setup Python environment

### Create and Use Virtual Environments

#### Install uv

`uv` is a fast Python package installer and virtual environment manager. You can install `uv` by running the following command:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Add the `uv` executable to your system's PATH

Source the appropriate environment file for your shell:

```sh
# On Bash, Zsh, or Sh:
source $HOME/.local/bin/env
# On Fish:
source $HOME/.local/bin/env.fish
```

You may need to restart your shell or open a new terminal session for the changes to take effect.

#### Create and Use Virtual Environments with uv

Create a new virtual environment:

```sh
uv venv .venv
```

#### Activate the virtual environment

```sh
# On Windows:
.venv\Scripts\activate
# On MacOS/Linux:
source .venv/bin/activate
```

#### To confirm the virtual environment is activated, check the location of your Python interpreter:

```sh
# On Windows:
where python
# On MacOS/Linux:
which python
```

#### Check python version

```sh
python --version
```

#### Install packages using uv

Install packages using a requirements file:

```sh
uv pip install -r requirements.txt
```

#### Check packages available for update

```sh
uv pip list --outdated
```

#### Upgrade packages

```sh
uv pip install -r requirements.txt --upgrade
```

#### Deactivate a virtual environment

```sh
# On Windows:
.venv\Scripts\deactivate
# On MacOS/Linux:
deactivate
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

Runs the tests in interactive watch mode:

```sh
yarn test:watch
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
