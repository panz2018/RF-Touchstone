interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R
  toBeDisabled(): R
  toHaveValue(_value: string | number | string[] | null): R
  toHaveTextContent(_text: string | RegExp): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {
    [key: string]: any
  }
  interface AsymmetricMatchersContaining extends CustomMatchers {
    [key: string]: any
  }
}
export {}
