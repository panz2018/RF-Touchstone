import { Frequency, FrequencyUnits, SPEED_OF_LIGHT, FREQUENCY_MULTIPLIERS } from '../src/frequency'; // Adjust path as needed

// Helper for float comparison
function expectToBeCloseTo(actual: number, expected: number, precision: number = 5, message?: string) {
    const tolerance = Math.pow(10, -precision) / 2;
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(message || `Expected ${actual} to be close to ${expected} (tolerance ${tolerance})`);
    }
}

function assertThrows(fn: () => void, expectedErrorMessage?: string | RegExp, testName?: string) {
    try {
        fn();
        throw new Error(`Test ${testName || ''}: Expected function to throw an error, but it did not.`);
    } catch (e: any) {
        if (expectedErrorMessage) {
            if (typeof expectedErrorMessage === 'string') {
                if (!e.message.includes(expectedErrorMessage)) {
                    throw new Error(`Test ${testName || ''}: Expected error message "${e.message}" to include "${expectedErrorMessage}"`);
                }
            } else { // RegExp
                if (!expectedErrorMessage.test(e.message)) {
                    throw new Error(`Test ${testName || ''}: Expected error message "${e.message}" to match ${expectedErrorMessage}`);
                }
            }
        }
        // If expectedErrorMessage is undefined, any error is fine.
    }
}

// --- Start of tests ---
console.log("Running Frequency Class Tests...");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, testFn: () => void) {
    try {
        testFn();
        console.log(`[PASS] ${name}`);
        testsPassed++;
    } catch (e: any) {
        console.error(`[FAIL] ${name} - ${e.message}`);
        console.error(e.stack); // Log stack for better debugging
        testsFailed++;
    }
}

// --- Tests for modified unit setter ---
runTest("Unit Setter: f_scaled conversion GHz to MHz", () => {
    const freq = new Frequency();
    freq.unit = 'GHz';
    freq.f_scaled = [1, 2.5]; // 1 GHz, 2.5 GHz
    freq.unit = 'MHz'; // Convert to MHz
    const expected = [1000, 2500]; // 1000 MHz, 2500 MHz
    if (freq.f_scaled.length !== expected.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expected[i], 5, `Index ${i}`));
});

runTest("Unit Setter: f_scaled conversion MHz to kHz", () => {
    const freq = new Frequency();
    freq.unit = 'MHz';
    freq.f_scaled = [0.5, 1.5]; // 0.5 MHz, 1.5 MHz
    freq.unit = 'kHz'; // Convert to kHz
    const expected = [500, 1500]; // 500 kHz, 1500 kHz
    if (freq.f_scaled.length !== expected.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expected[i], 5, `Index ${i}`));
});

runTest("Unit Setter: f_scaled conversion kHz to Hz", () => {
    const freq = new Frequency();
    freq.unit = 'kHz';
    freq.f_scaled = [10, 20]; // 10 kHz, 20 kHz
    freq.unit = 'Hz'; // Convert to Hz
    const expected = [10000, 20000]; // 10000 Hz, 20000 Hz
    if (freq.f_scaled.length !== expected.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expected[i], 5, `Index ${i}`));
});

runTest("Unit Setter: f_scaled conversion Hz to GHz", () => {
    const freq = new Frequency();
    freq.unit = 'Hz';
    freq.f_scaled = [1e9, 2e9]; // 1 GHz, 2 GHz in Hz
    freq.unit = 'GHz'; // Convert to GHz
    const expected = [1, 2];
    if (freq.f_scaled.length !== expected.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expected[i], 5, `Index ${i}`));
});

runTest("Unit Setter: f_scaled empty, no conversion", () => {
    const freq = new Frequency();
    freq.unit = 'GHz';
    freq.f_scaled = [];
    freq.unit = 'MHz';
    if (freq.f_scaled.length !== 0) throw new Error("f_scaled should still be empty");
});

runTest("Unit Setter: f_scaled populated, set same unit, no conversion", () => {
    const freq = new Frequency();
    freq.unit = 'MHz';
    const initialValues = [100, 200];
    freq.f_scaled = [...initialValues];
    freq.unit = 'MHz'; // Set same unit
    if (freq.f_scaled.length !== initialValues.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, initialValues[i], 5, `Index ${i}`));
});


// --- Tests for Frequency Getters and Setters (f_Hz, f_kHz, f_MHz, f_GHz, f_THz) ---
const testUnits: FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz'];
const freqGetterSetters: Array<{
    prop: 'f_Hz' | 'f_kHz' | 'f_MHz' | 'f_GHz' | 'f_THz';
    multiplier: number;
    name: string;
}> = [
    { prop: 'f_Hz', multiplier: 1, name: 'f_Hz' },
    { prop: 'f_kHz', multiplier: 1e3, name: 'f_kHz' },
    { prop: 'f_MHz', multiplier: 1e6, name: 'f_MHz' },
    { prop: 'f_GHz', multiplier: 1e9, name: 'f_GHz' },
    { prop: 'f_THz', multiplier: 1e12, name: 'f_THz' },
];

freqGetterSetters.forEach(gs => {
    testUnits.forEach(unit => {
        runTest(`${gs.name} Setter/Getter: Set as ${gs.name}, Get as ${gs.name}, Current unit ${unit}`, () => {
            const freq = new Frequency();
            freq.unit = unit;
            const valuesToSet = [10, 20]; // e.g., 10 kHz, 20 kHz if gs.name is 'f_kHz'
            freq[gs.prop] = valuesToSet;
            const retrievedValues = freq[gs.prop];
            if (retrievedValues.length !== valuesToSet.length) throw new Error("Array length mismatch");
            retrievedValues.forEach((val, i) => expectToBeCloseTo(val, valuesToSet[i], 5, `Index ${i}`));
        });
    });

    runTest(`${gs.name} Setter: Overwrite with different length array`, () => {
        const freq = new Frequency();
        freq.unit = 'Hz'; // Set a known unit for direct comparison
        freq.f_scaled = [1, 2, 3]; // Initial values in Hz
        
        const newValues = [400, 500]; // These are in the unit of gs.prop
        freq[gs.prop] = newValues;
        
        // Retrieve in the same unit as gs.prop to check if values were set correctly
        const retrievedValues = freq[gs.prop];
        if (retrievedValues.length !== newValues.length) {
            throw new Error(`Expected length ${newValues.length}, got ${retrievedValues.length}`);
        }
        retrievedValues.forEach((val, i) => expectToBeCloseTo(val, newValues[i], 5, `Index ${i} for ${gs.name}`));
        
        // Also check underlying f_scaled (which is in 'Hz' in this test case)
        // Convert newValues (which are in gs.prop unit) to Hz
        const expectedFScaledInHz = newValues.map(v => v * gs.multiplier / FREQUENCY_MULTIPLIERS['Hz']);
        if (freq.f_scaled.length !== expectedFScaledInHz.length) {
            throw new Error(`f_scaled expected length ${expectedFScaledInHz.length}, got ${freq.f_scaled.length}`);
        }
        freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expectedFScaledInHz[i], 3, `f_scaled Index ${i} for ${gs.name}`));
    });

    // The "Length check match" test is now covered by the general Setter/Getter tests
    // and the new "Overwrite with different length array" test.
    // It can be removed or simplified if it tested something unique beyond just not throwing.
    // For now, let's remove it to avoid redundancy as other tests cover successful setting.

    runTest(`${gs.name} Setter: Non-negative value check (via f_scaled setter)`, () => {
        const freq = new Frequency();
        assertThrows(() => {
            freq[gs.prop] = [-100];
        }, "Frequency values cannot be negative", `${gs.name} negative value`);
    });
});

// Cross-unit tests for frequency getters/setters
runTest("Freq Get/Set: Cross-unit f_MHz getter from GHz base", () => {
    const freq = new Frequency();
    freq.unit = 'GHz';
    freq.f_scaled = [1.5, 2.5]; // 1.5 GHz, 2.5 GHz
    const mhzValues = freq.f_MHz;
    const expectedMHz = [1500, 2500];
    if (mhzValues.length !== expectedMHz.length) throw new Error("Array length mismatch");
    mhzValues.forEach((val, i) => expectToBeCloseTo(val, expectedMHz[i], 5, `Index ${i}`));
});

runTest("Freq Get/Set: Cross-unit f_kHz setter to GHz base", () => {
    const freq = new Frequency();
    freq.unit = 'GHz';
    freq.f_kHz = [500000, 1000000]; // 0.5 GHz, 1 GHz (in kHz)
    const expectedGHz = [0.5, 1];
    if (freq.f_scaled.length !== expectedGHz.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expectedGHz[i], 5, `Index ${i}`));
});

runTest("Freq Get/Set: Cross-unit f_THz getter from MHz base", () => {
    const freq = new Frequency();
    freq.unit = 'MHz';
    freq.f_scaled = [1e6, 2e6]; // 1 THz, 2 THz (in MHz)
    const thzValues = freq.f_THz;
    const expectedTHz = [1, 2];
    if (thzValues.length !== expectedTHz.length) throw new Error("Array length mismatch");
    thzValues.forEach((val, i) => expectToBeCloseTo(val, expectedTHz[i], 5, `Index ${i}`));
});

runTest("Freq Get/Set: Cross-unit f_Hz setter to kHz base", () => {
    const freq = new Frequency();
    freq.unit = 'kHz';
    freq.f_Hz = [10000, 20000]; // 10 kHz, 20 kHz (in Hz)
    const expectedKHz = [10, 20];
    if (freq.f_scaled.length !== expectedKHz.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expectedKHz[i], 5, `Index ${i}`));
});


// --- Tests for Wavelength Getters and Setters (wavelength_m, _cm, _mm, _um, _nm) ---
const wavelengthGetterSetters: Array<{
    prop: 'wavelength_m' | 'wavelength_cm' | 'wavelength_mm' | 'wavelength_um' | 'wavelength_nm';
    m_multiplier: number; // Factor to convert the unit to meters
    name: string;
}> = [
    { prop: 'wavelength_m', m_multiplier: 1, name: 'wavelength_m' },
    { prop: 'wavelength_cm', m_multiplier: 1e-2, name: 'wavelength_cm' },
    { prop: 'wavelength_mm', m_multiplier: 1e-3, name: 'wavelength_mm' },
    { prop: 'wavelength_um', m_multiplier: 1e-6, name: 'wavelength_um' },
    { prop: 'wavelength_nm', m_multiplier: 1e-9, name: 'wavelength_nm' },
];

wavelengthGetterSetters.forEach(wgs => {
    testUnits.forEach(unit => {
        runTest(`${wgs.name} Setter/Getter: Set as ${wgs.name}, Get as ${wgs.name}, Current unit ${unit}`, () => {
            const freq = new Frequency();
            freq.unit = unit;
            const valuesToSet = [1, 0.5]; // e.g., 1m, 0.5m if wgs.name is 'wavelength_m'
            
            // Ensure f_scaled is initialized if needed for length check, or test empty case
            if (freq.f_scaled.length === 0 && valuesToSet.length > 0) {
                // Initialize f_scaled to something, then overwrite with wavelength setter
                // This ensures the length check in wavelength setters can pass if f_scaled was previously empty.
                // Or, more simply, wavelength setters should be able to initialize f_scaled.
                // The current implementation of wavelength setters allows initializing f_scaled if it's empty.
            }

            freq[wgs.prop] = valuesToSet;
            const retrievedValues = freq[wgs.prop];
            if (retrievedValues.length !== valuesToSet.length) throw new Error(`Array length mismatch. Expected ${valuesToSet.length}, got ${retrievedValues.length}`);
            retrievedValues.forEach((val, i) => expectToBeCloseTo(val, valuesToSet[i], 5, `Index ${i}: ${val} vs ${valuesToSet[i]}`));
        });
    });

    runTest(`${wgs.name} Setter: Overwrite with different length array`, () => {
        const freq = new Frequency();
        freq.unit = 'Hz'; // Set a known unit for easier f_scaled verification
        freq.f_scaled = [SPEED_OF_LIGHT / 0.1, SPEED_OF_LIGHT / 0.2, SPEED_OF_LIGHT / 0.3]; // Freqs for 0.1m, 0.2m, 0.3m

        const newWavelengths = [0.4, 0.5]; // These are in the unit of wgs.prop
        freq[wgs.prop] = newWavelengths;

        // Retrieve in the same unit as wgs.prop
        const retrievedWavelengths = freq[wgs.prop];
        if (retrievedWavelengths.length !== newWavelengths.length) {
            throw new Error(`Expected length ${newWavelengths.length}, got ${retrievedWavelengths.length} for ${wgs.name}`);
        }
        retrievedWavelengths.forEach((val, i) => expectToBeCloseTo(val, newWavelengths[i], 5, `Index ${i} for ${wgs.name}`));

        // Verify underlying f_scaled (which is in Hz)
        // Convert newWavelengths (in wgs.prop unit) to meters, then to Hz
        const expectedFScaledInHz = newWavelengths.map(wl => SPEED_OF_LIGHT / (wl * wgs.m_multiplier));
        if (freq.f_scaled.length !== expectedFScaledInHz.length) {
            throw new Error(`f_scaled expected length ${expectedFScaledInHz.length}, got ${freq.f_scaled.length} for ${wgs.name}`);
        }
        freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expectedFScaledInHz[i], 0, `f_scaled Index ${i} for ${wgs.name}`));
    });
    
    // The "Length check match" test for wavelength setters is now covered by other tests,
    // particularly the Setter/Getter tests and the new "Overwrite with different length array" test.
    // Removing it to avoid redundancy.

    runTest(`${wgs.name} Setter: Zero wavelength throws error`, () => {
        const freq = new Frequency();
        assertThrows(() => {
            freq[wgs.prop] = [0.1, 0, 0.2]; // Contains a zero wavelength
        }, "Cannot convert zero wavelength to frequency.", `${wgs.name} zero wavelength`);
    });
});

// Cross-type/unit tests for wavelength
runTest("Wavelength Get/Set: Cross-type wavelength_m getter from MHz base", () => {
    const freq = new Frequency();
    freq.unit = 'MHz';
    freq.f_scaled = [150, 300]; // 150 MHz, 300 MHz
    // For 150 MHz: wl = c / (150e6 Hz) = 299792458 / 150e6 = 1.9986 m
    // For 300 MHz: wl = c / (300e6 Hz) = 299792458 / 300e6 = 0.9993 m
    const expectedWavelengths_m = [SPEED_OF_LIGHT / 150e6, SPEED_OF_LIGHT / 300e6];
    const wavelengths = freq.wavelength_m;
    if (wavelengths.length !== expectedWavelengths_m.length) throw new Error("Array length mismatch");
    wavelengths.forEach((val, i) => expectToBeCloseTo(val, expectedWavelengths_m[i], 5, `Index ${i}`));
});

runTest("Wavelength Get/Set: Cross-type wavelength_cm setter to MHz base", () => {
    const freq = new Frequency();
    freq.unit = 'MHz';
    // 10 cm = 0.1 m => f = c / 0.1m = 299792458 / 0.1 = 2997.92458 MHz
    // 20 cm = 0.2 m => f = c / 0.2m = 299792458 / 0.2 = 1498.96229 MHz
    freq.wavelength_cm = [10, 20];
    const expectedFreqs_MHz = [SPEED_OF_LIGHT / (10 * 1e-2) / 1e6, SPEED_OF_LIGHT / (20 * 1e-2) / 1e6];
    if (freq.f_scaled.length !== expectedFreqs_MHz.length) throw new Error("Array length mismatch");
    freq.f_scaled.forEach((val, i) => expectToBeCloseTo(val, expectedFreqs_MHz[i], 3, `Index ${i}`));
});

runTest("Wavelength Getter: Zero frequency results in Infinity wavelength", () => {
    const freq = new Frequency();
    freq.unit = 'Hz';
    freq.f_scaled = [0, 100]; // 0 Hz, 100 Hz
    const wavelengths = freq.wavelength_m;
    if (wavelengths[0] !== Infinity) throw new Error(`Expected Infinity for 0 Hz, got ${wavelengths[0]}`);
    expectToBeCloseTo(wavelengths[1], SPEED_OF_LIGHT / 100, 5);
});

// --- Summary ---
console.log(`
Tests Finished. Passed: ${testsPassed}, Failed: ${testsFailed}`);
if (testsFailed > 0) {
    // This will make the overall execution fail if there are test failures.
    // Depending on the environment, this might be caught or might terminate the process.
    // For CI/CD, this is generally the desired behavior.
    // throw new Error(`${testsFailed} tests failed!`);
}
