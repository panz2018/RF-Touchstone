import { run } from './python'
import type { TouchstoneParameter } from '@/touchstone'

/**
 * Read and parse Touchstone format string using Python scikit-rf library
 *
 * @param content - Touchstone format string to parse
 * @param nports - Number of ports in the network
 * @param parameter - Network parameter type ('S', 'Y', 'Z', 'G', 'H')
 * @returns JSON string containing parsed network data with the following structure:
 * ```json
 * {
 *   "frequency": {
 *     "unit": string,     // Frequency unit (Hz, kHz, MHz, GHz)
 *     "f_scaled": number[]  // Array of frequency f_scaled
 *   },
 *   "impedance": number,  // Reference impedance value
 *   "matrix": [          // 3D array: [output_port][input_port][frequency]
 *     [
 *       [
 *         { "real": number, "imag": number }  // Complex parameter value
 *       ]
 *     ]
 *   ]
 * }
 * ```
 *
 * @remarks
 * This function uses scikit-rf to:
 * 1. Read Touchstone data from a string buffer
 * 2. Extract frequency information (unit and f_scaled)
 * 3. Get reference impedance value
 * 4. Convert network parameters to complex numbers
 * 5. Return all data in a JSON format
 */
export const pythonReadContent = async (
  content: string,
  nports: number,
  parameter: TouchstoneParameter
) => {
  const code = `
    import io, json
    import skrf
    import numpy as np
    from skrf.io.general import to_json_string

    # Create a StringIO object with the touchstone content
    f = io.StringIO("""${content}""")
    f.name = 'example.s${nports}p'
    
    # Read the network from the string buffer
    ntwk = skrf.Network(f)

    # Convert network data to JSON format
    data = {
        'frequency': {
            'unit': ntwk.frequency.unit,            # Get frequency unit
            'f_scaled': ntwk.frequency.f_scaled.tolist()  # Get scaled frequency points
        },
        'impedance': float(ntwk.z0[0][0]),         # Get reference impedance
        'matrix': []
    }

    # Convert network parameters to list format
    # Note: scikit-rf matrix indexing: [frequency_index, output_port, input_port]
    # We convert it to: [output_port][input_port][frequency_index]
    for i in range(${nports}):          # Output port loop
        data_out = []
        for j in range(${nports}):      # Input port loop
            data_in = []
            for f_idx in range(len(data['frequency']['f_scaled'])):  # Frequency loop
                # Get parameter value at current indices
                value = ntwk.${parameter.toLowerCase()}[f_idx, i, j]
                # Store as complex number with real and imaginary parts
                data_in.append({
                    're': float(value.real),
                    'im': float(value.imag)
                })
            data_out.append(data_in)
        data['matrix'].append(data_out)

    # Convert to JSON string and print
    print(json.dumps(data))
  `

  return await run(code)
}
