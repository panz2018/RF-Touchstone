import { run } from './python'
import { Touchstone } from '@/touchstone'

/**
 * Generate touchstone file string from a Touchstone instance using python scikit-rf library
 * @param touchstone
 * @returns
 */
export const pythonGenerateTouchstoneString = async (
  touchstone: Touchstone
) => {
  console.log(touchstone)

  const code = `
# import skrf as rf

print(skrf)
  `
  return await run(code)
}
