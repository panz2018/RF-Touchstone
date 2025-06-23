import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// Import the module to mock its exports
import * as TouchstoneViewerModule from '../src/TouchstoneViewer';
import TouchstoneViewer from '../src/TouchstoneViewer' // Default export for rendering
import { Touchstone, Complex } from 'rf-touchstone' // Actual import for integration parts

// Mock specific functions from TouchstoneViewer.tsx
vi.mock('../src/TouchstoneViewer', async (importOriginal) => {
  const actual = await importOriginal<typeof TouchstoneViewerModule>();
  return {
    ...actual, // Import and retain all other exports (including default for component)
    readUrl: vi.fn(), // This is TouchstoneViewer's internal readUrl helper
    readFile: vi.fn(), // This is TouchstoneViewer's internal readFile helper
  };
});

// Mock the UrlLoader component
let mockCurrentOnUrlSubmit: ((url: string) => void) | null = null;
vi.mock('../src/components/UrlLoader', () => ({
  default: vi.fn(({ onUrlSubmit }) => {
    // Store the onUrlSubmit prop so we can call it from tests
    mockCurrentOnUrlSubmit = onUrlSubmit;
    return (
      <div>
        {/* Test trigger for default URL */}
        <button data-testid="mock-urllloader-submit" onClick={() => {
          if (mockCurrentOnUrlSubmit) mockCurrentOnUrlSubmit('http://example.com/test.s2p');
        }}>
          Mock UrlLoader Submit
        </button>
        {/* Test trigger for a specific URL, e.g., complex one */}
        <button data-testid="mock-urllloader-submit-complex" onClick={() => {
          if (mockCurrentOnUrlSubmit) mockCurrentOnUrlSubmit('https://raw.githubusercontent.com/some/path/filename%20with%20spaces.s3p?query=param');
        }}>
          Mock UrlLoader Submit Complex
        </button>
      </div>
    );
  }),
}));

// Mocking fetch (can be kept if readUrl implementation itself is tested elsewhere or if other fetches exist)
global.fetch = vi.fn()

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
})

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()

const mockSampleS2PContent = `! Sample S2P File
# HZ S RI R 50
1000000000 0.9 -0.1 0.01 0.02 0.01 0.02 0.8 -0.15
2000000000 0.8 -0.2 0.02 0.03 0.02 0.03 0.7 -0.25`

const mockSampleS2P_MA_Content = `! Sample S2P File MA
# GHZ S MA R 50
1 0.9055385138137417 -6.340191745909912 0.0223606797749979 26.56505117707799 0.0223606797749979 26.56505117707799 0.8139410298399634 -10.61951135003242
2 0.8246211251235321 -14.036243467926479 0.03605551275463989 33.69006752597978 0.03605551275463989 33.69006752597978 0.7382411525294449 -19.983098581191387`


const mockInvalidFileContent = `! Invalid data`

// Helper to create a Touchstone object from string content for test assertions
const createTouchstoneFromString = (content: string, nports = 2): Touchstone => {
  const ts = new Touchstone()
  ts.readContent(content, nports)
  return ts
}

describe('TouchstoneViewer Component', () => {
  let mockCreateObjectURL: vi.Mock
  let mockRevokeObjectURL: vi.Mock
  let mockAnchorClick: vi.Mock
  let mockSetAttribute: vi.Mock
  let mockAppendChild: vi.Mock
  let mockRemoveChild: vi.Mock

  // Cast the mocked functions for use in tests
  const mockReadUrl = TouchstoneViewerModule.readUrl as vi.Mock;
  const mockReadFile = TouchstoneViewerModule.readFile as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock for the initial /sample.s2p load by readUrl
    const defaultTs = createTouchstoneFromString(mockSampleS2PContent);
    mockReadUrl.mockImplementation(async (url: string) => {
      if (url === '/sample.s2p') {
        return defaultTs;
      }
      // For other URLs, tests should provide their own specific mock implementation
      // or this mock will throw, indicating a missing specific mock.
      throw new Error(`mockReadUrl called with unexpected URL: ${url}. Specific mock needed for this test case.`);
    });

    // The global.fetch mock is less critical if TouchstoneViewer's readUrl is directly mocked,
    // but kept for completeness or if any passthrough to actual fetch were intended.
    ;(global.fetch as vi.Mock).mockImplementation(async (url: string) => {
      if (url.toString().endsWith('sample.s2p')) {
        return ({
          ok: true,
          statusText: 'OK',
          text: async () => mockSampleS2PContent,
        });
      }
      return ({
        ok: false,
        statusText: 'Not Found by global.fetch mock',
        text: async () => 'File not found by global.fetch mock',
      });
    });

    mockCreateObjectURL = global.URL.createObjectURL as vi.Mock
    mockRevokeObjectURL = global.URL.revokeObjectURL as vi.Mock
    mockAnchorClick = vi.fn()
    mockSetAttribute = vi.fn()
    mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})


    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockAnchorClick,
          setAttribute: mockSetAttribute,
          style: {},
        } as any
      }
      return document.createElement(tagName)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks() // Restore all spies and original implementations
  })


  it('renders initial state correctly and loads default sample file', async () => {
    render(<TouchstoneViewer />);
    expect(screen.getByText(/Touchstone File Viewer/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Upload a Touchstone file/i)
    ).toBeInTheDocument()
    // The filename is initially empty, then set by loadFileContent.
    // The "Loading..." message might briefly show without a filename or with a default.
    // Given loadFileContent now sets the filename, the "Loading <filename>..."
    // message will appear once loadFileContent starts for '/sample.s2p'.
    expect(screen.getByText(/Loading sample.s2p.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      // Filename is set by loadFileContent
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    const defaultTs = createTouchstoneFromString(mockSampleS2PContent)
    expect(screen.getByText(defaultTs.nports!.toString())).toBeInTheDocument() // Port number
    // Check for Frequency Unit (selector will have the value)
    expect(screen.getByDisplayValue(defaultTs.frequency!.unit)).toBeInTheDocument()
    // Check for Format (selector will have the value)
    expect(screen.getByDisplayValue(/RI/i)).toBeInTheDocument() // Default is RI
    expect(screen.getByText(defaultTs.resistance + ' Ohms')).toBeInTheDocument()
  })

  it('displays parsed data from the default sample file', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(screen.getByText('1000000000')).toBeInTheDocument()
      expect(screen.getAllByText('0.9000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('-0.1000').length).toBeGreaterThan(0)
    })
  })

  it('handles file upload and displays new data', async () => {
    const mockUploadedFileContent = `! Uploaded S2P File
# GHZ S MA R 75
1 0.5 10 0.05 20 0.05 20 0.4 30
`
    const uploadedFile = new File([mockUploadedFileContent], 'uploaded.s2p', {
      type: 'text/plain',
    })
    const uploadedTs = createTouchstoneFromString(mockUploadedFileContent)
    mockReadFile.mockResolvedValue(uploadedTs); // Configure mock for this test

    render(<TouchstoneViewer />);
    // Wait for initial load of sample.s2p to complete
    await waitFor(() => {
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });
    mockReadUrl.mockClear(); // Clear mock after initial load to ensure it's not called by file upload

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } });

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(uploadedFile);
      expect(mockReadUrl).not.toHaveBeenCalled(); // IMPORTANT: readUrl should not be called
      expect(
        screen.getByText(/Currently displaying: Data from uploaded.s2p/i)
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue(uploadedTs.frequency!.unit)).toBeInTheDocument();
      expect(screen.getByText(uploadedTs.resistance + ' Ohms')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Frequency
      expect(screen.getAllByText('0.5000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('10.0000').length).toBeGreaterThan(0);
    });
  })

  it('handles and displays error for an invalid uploaded file', async () => {
    const invalidFile = new File([mockInvalidFileContent], 'invalid.s2p', {
      type: 'text/plain',
    })
    mockReadFile.mockRejectedValueOnce(new Error('Mocked read error for invalid file'));

    render(<TouchstoneViewer />);
    await waitFor(() => {
      // Initial load still happens
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });
    mockReadUrl.mockClear(); // Clear mock after initial load

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(invalidFile);
      expect(mockReadUrl).not.toHaveBeenCalled(); // IMPORTANT
      expect(screen.getByText(/Error with invalid.s2p/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Error: Mocked read error for invalid file/i)
      ).toBeInTheDocument()
    })
  })

  it('handles and displays error for an empty uploaded file', async () => {
    const emptyFile = new File([''], 'empty.s2p', { type: 'text/plain' })
    mockReadFile.mockRejectedValueOnce(new Error('File content is empty.')); // Consistent with readFile's own error

    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });
    mockReadUrl.mockClear(); // Clear mock after initial load

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [emptyFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(emptyFile);
      expect(mockReadUrl).not.toHaveBeenCalled(); // IMPORTANT
      expect(screen.getByText(/Error with empty.s2p/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Error: File content is empty./i)
      ).toBeInTheDocument()
    })
  })


  it('handles fetch error when loading default sample file', async () => {
    mockReadUrl.mockRejectedValueOnce(new Error('Mocked fetch error from readUrl'));

    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(
        screen.getByText(/Error: Mocked fetch error from readUrl/i)
      ).toBeInTheDocument()
    })
  })

  it('handles FileReader error during file upload', async () => {
    const errorFile = new File(['some content'], 'error.s2p', {
      type: 'text/plain',
    })
    mockReadFile.mockRejectedValueOnce(new Error('Mocked Error reading file.'));


    render(<TouchstoneViewer />);
    await waitFor(() => {
      // Default load
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });
    mockReadUrl.mockClear(); // Clear mock after initial load

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [errorFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(errorFile);
      expect(mockReadUrl).not.toHaveBeenCalled(); // IMPORTANT
      expect(screen.getByText(/Error with error.s2p/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Error: Mocked Error reading file./i)
      ).toBeInTheDocument()
    })
  })

  it('matches snapshot with loaded data', async () => {
    const { container } = render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })
    expect(container.firstChild).toMatchSnapshot()
  })

  describe('Format Switching', () => {
    it('allows switching data format and updates table display', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => {
        expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
      });

      // Default is RI
      expect(screen.getByText('S11 (Real)')).toBeInTheDocument();
      expect(screen.getByText('S11 (Imaginary)')).toBeInTheDocument();
      expect(screen.getAllByText('0.9000').length).toBeGreaterThan(0); // S11 Real for 1GHz
      expect(screen.getAllByText('-0.1000').length).toBeGreaterThan(0); // S11 Imag for 1GHz

      // Switch to MA
      const formatSelector = screen.getByDisplayValue(/RI/); // Selects the <select> element
      fireEvent.change(formatSelector, { target: { value: 'MA' } });

      await waitFor(() => {
        expect(screen.getByText('S11 (Magnitude)')).toBeInTheDocument();
        expect(screen.getByText('S11 (Angle (°))')).toBeInTheDocument();
      });
      // Values for MA for 1GHz from mockSampleS2PContent (0.9 -0.1j) -> mag = sqrt(0.9^2 + (-0.1)^2) approx 0.9055
      // angle = atan2(-0.1, 0.9) * 180/PI approx -6.34 degrees
      expect(screen.getAllByText('0.9055').length).toBeGreaterThan(0);
      expect(screen.getAllByText('-6.3402').length).toBeGreaterThan(0);


      // Switch to DB
      fireEvent.change(formatSelector, { target: { value: 'DB' } });
      await waitFor(() => {
        expect(screen.getByText('S11 (dB)')).toBeInTheDocument();
        expect(screen.getByText('S11 (Angle (°))')).toBeInTheDocument();
      });
      // Values for DB for 1GHz (mag 0.9055) -> 20*log10(0.9055) approx -0.869 dB
      // Angle is the same: -6.34 degrees
      expect(screen.getAllByText('-0.8690').length).toBeGreaterThan(0);
      expect(screen.getAllByText('-6.3402').length).toBeGreaterThan(0);

       // Switch back to RI
      fireEvent.change(formatSelector, { target: { value: 'RI' } });
      await waitFor(() => {
        expect(screen.getByText('S11 (Real)')).toBeInTheDocument();
        expect(screen.getByText('S11 (Imaginary)')).toBeInTheDocument();
      });
      expect(screen.getAllByText('0.9000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('-0.1000').length).toBeGreaterThan(0);
    });
  });

  describe('Frequency Unit Switching Bug Verification', () => {
    it('correctly converts frequencies when switching units multiple times', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => {
        // Wait for the default file (sample.s2p) to load
        expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
      });

      // Initial state: Hz. First frequency from mockSampleS2PContent is 1000000000 Hz
      // Displayed with .toFixed(4) in the table
      expect(screen.getByText('1000000000.0000')).toBeInTheDocument();
      let frequencyUnitSelector = screen.getByDisplayValue('Hz');

      // 1. Change to GHz
      fireEvent.change(frequencyUnitSelector, { target: { value: 'GHz' } });
      await waitFor(() => {
        // 1000000000 Hz = 1 GHz
        expect(screen.getByText('1.0000')).toBeInTheDocument();
      });
      frequencyUnitSelector = screen.getByDisplayValue('GHz'); // Re-find selector if its instance changes

      // 2. Change back to Hz
      fireEvent.change(frequencyUnitSelector, { target: { value: 'Hz' } });
      await waitFor(() => {
        // Should be back to 1000000000 Hz
        expect(screen.getByText('1000000000.0000')).toBeInTheDocument();
      });
      frequencyUnitSelector = screen.getByDisplayValue('Hz');

      // 3. Change to MHz
      fireEvent.change(frequencyUnitSelector, { target: { value: 'MHz' } });
      await waitFor(() => {
        // 1000000000 Hz = 1000 MHz
        expect(screen.getByText('1000.0000')).toBeInTheDocument();
      });
      frequencyUnitSelector = screen.getByDisplayValue('MHz');

      // 4. Change back to GHz (from MHz)
      fireEvent.change(frequencyUnitSelector, { target: { value: 'GHz' } });
      await waitFor(() => {
        // 1000 MHz = 1 GHz
        expect(screen.getByText('1.0000')).toBeInTheDocument();
      });
      frequencyUnitSelector = screen.getByDisplayValue('GHz');

      // 5. Change to KHz (from GHz)
      fireEvent.change(frequencyUnitSelector, { target: { value: 'KHz' } });
      await waitFor(() => {
        // 1 GHz = 1,000,000 KHz
        expect(screen.getByText('1000000.0000')).toBeInTheDocument();
      });
      frequencyUnitSelector = screen.getByDisplayValue('KHz');

      // 6. Change back to Hz (from KHz)
      fireEvent.change(frequencyUnitSelector, { target: { value: 'Hz' } });
      await waitFor(() => {
        // 1,000,000 KHz = 1,000,000,000 Hz
        expect(screen.getByText('1000000000.0000')).toBeInTheDocument();
      });
    });
  });

  describe('Copy Data Button', () => {
    let touchstoneToStringSpy: vi.SpyInstance;

    beforeEach(() => {
      // Spy on Touchstone.prototype.toString BEFORE each test in this suite
      touchstoneToStringSpy = vi.spyOn(Touchstone.prototype, 'toString');
    });

    afterEach(() => {
      // Restore the spy AFTER each test in this suite
      touchstoneToStringSpy.mockRestore();
    });

    it('is disabled when no data is loaded', () => {
      render(<TouchstoneViewer />);
      const copyButton = screen.getByRole('button', { name: /Copy Data/i });
      expect(copyButton).toBeDisabled();
    });

    it('calls Touchstone.toString and navigator.clipboard.writeText with data', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => {
        expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy Data/i });
      expect(copyButton).not.toBeDisabled();

      const mockClipboardWriteText = navigator.clipboard.writeText as vi.Mock;
      mockClipboardWriteText.mockResolvedValueOnce(undefined); // Simulate successful copy

      fireEvent.click(copyButton);

      expect(touchstoneToStringSpy).toHaveBeenCalledTimes(1);
      const expectedContent = mockSampleS2PContent; // Touchstone.toString() should reconstruct this

      // Need to ensure the internal Touchstone object, when toString() is called,
      // produces the original input string if formatting options haven't changed.
      // The current mockSampleS2PContent is simple.
      // A more robust test would involve a Touchstone object created and then calling its toString().
      // For now, we assume toString() returns something specific.
      // Let's use the actual content loaded as the expected content.
      const loadedTs = createTouchstoneFromString(mockSampleS2PContent);
      const expectedToStringResult = loadedTs.toString();


      expect(mockClipboardWriteText).toHaveBeenCalledWith(expectedToStringResult);

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
      });
      await waitFor(() => expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument(), { timeout: 4000 });

    });

    it('shows error message if copying fails', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      const copyButton = screen.getByRole('button', { name: /Copy Data/i });
      const mockClipboardWriteText = navigator.clipboard.writeText as vi.Mock;
      mockClipboardWriteText.mockRejectedValueOnce(new Error('Copy failed'));

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to copy.')).toBeInTheDocument();
      });
       await waitFor(() => expect(screen.queryByText('Failed to copy.')).not.toBeInTheDocument(), { timeout: 4000 });
    });
  });

  describe('Download File Button', () => {
     let touchstoneToStringSpy: vi.SpyInstance;

    beforeEach(() => {
      touchstoneToStringSpy = vi.spyOn(Touchstone.prototype, 'toString');
    });

    afterEach(() => {
      touchstoneToStringSpy.mockRestore();
    });

    it('is disabled when no data is loaded', () => {
      render(<TouchstoneViewer />);
      const downloadButton = screen.getByRole('button', { name: /Download File/i });
      expect(downloadButton).toBeDisabled();
    });

    it('triggers download with correct data and filename', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      const downloadButton = screen.getByRole('button', { name: /Download File/i });
      expect(downloadButton).not.toBeDisabled();

      const loadedTs = createTouchstoneFromString(mockSampleS2PContent);
      const expectedToStringResult = loadedTs.toString();
      mockCreateObjectURL.mockReturnValueOnce('blob:http://localhost/mock-url');


      fireEvent.click(downloadButton);

      expect(touchstoneToStringSpy).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);

      const blobContent = await (mockCreateObjectURL.mock.calls[0][0] as Blob).text()
      expect(blobContent).toEqual(expectedToStringResult);

      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      // expect(mockSetAttribute).toHaveBeenCalledWith('href', 'blob:http://localhost/mock-url');
      // expect(mockSetAttribute).toHaveBeenCalledWith('download', 'sample.s2p');
      // For some reason setAttribute is not directly spied on the object from createElement
      const linkElement = mockAppendChild.mock.calls[0][0] as HTMLAnchorElement;
      expect(linkElement.href).toBe('blob:http://localhost/mock-url');
      expect(linkElement.download).toBe('sample.s2p');


      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-url');
    });

    it('uses the default loaded filename for download when component mounts', async () => {
      // TouchstoneViewer now always loads 'sample.s2p' on mount.
      render(<TouchstoneViewer />);

      await waitFor(() => {
         // Ensure the default file is loaded and component is ready
         expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /Download File/i });
      expect(downloadButton).not.toBeDisabled(); // Should be enabled after default load

      fireEvent.click(downloadButton);

      // Check that the download is initiated with 'sample.s2p' as the filename
      // because that's the fileName state after default load.
      const linkElement = mockAppendChild.mock.calls[0][0] as HTMLAnchorElement;
      expect(linkElement.download).toBe('sample.s2p');
    });

  });

  // New describe block for URL Loading tests
  describe('URL Loading Functionality', () => {
    const mockUrlLoaderSubmitUrl = 'http://example.com/test.s2p';

    beforeEach(() => {
      // Ensure readUrl is reset for these specific tests if needed,
      // though the main beforeEach already clears all mocks.
      // mockReadUrl.mockClear(); already done in global beforeEach
    });

    it('successfully loads and displays data from a URL', async () => {
      const mockUrlTs = createTouchstoneFromString(`! Mock S2P from URL\n# GHZ S RI R 50\n3 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8`);
      mockReadUrl.mockResolvedValue(mockUrlTs); // Mock readUrl for this specific URL load

      render(<TouchstoneViewer />);
      // Wait for initial load to complete if any
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      // Simulate the UrlLoader calling its onUrlSubmit prop, which in turn calls handleUrlSubmit
      // To do this without actually rendering UrlLoader, we need to expose handleUrlSubmit or test its effects via loadFileContent
      // Since loadFileContent calls readUrl, and handleUrlSubmit calls loadFileContent,
      // we can trigger handleUrlSubmit indirectly if we can call it.
      // However, handleUrlSubmit is not directly exposed.
      // A better approach for a unit test might be to find the UrlLoader mock and simulate its action.

      // Let's assume UrlLoader is part of the render and we can simulate its callback.
      // For this, we'd need to NOT mock TouchstoneViewer's internals in a way that hides handleUrlSubmit.
      // The current mock setup is:
      // vi.mock('../src/TouchstoneViewer', async (importOriginal) => { ... readUrl: vi.fn(), readFile: vi.fn() ... });
      // This means the actual TouchstoneViewer component is rendered, but its `readUrl` and `readFile` calls are to our mocks.
      // So, we need a way to simulate the UrlLoader component calling the `handleUrlSubmit` prop.
      // The easiest way is to add a test-id or role to the UrlLoader or its button if it were rendered.
      // Since we don't have UrlLoader rendered directly by these tests (it's a child component),
      // we'll test the effect of `loadFileContent` which `handleUrlSubmit` calls.

      // Directly test the effect of calling `loadFileContent` as `handleUrlSubmit` would.
      // Get the instance of the component or simulate the call chain.
      // The `loadFileContent` is already tested by the default load.
      // So, we need to simulate the specific call to `handleUrlSubmit` or `loadFileContent` with a new URL.

      // Re-rendering and then triggering a conceptual "URL submit"
      // This is tricky because UrlLoader is a child.
      // The most straightforward way with the current setup is to ensure `loadFileContent` (called by `handleUrlSubmit`)
      // behaves as expected when `readUrl` is mocked for a new URL.
      // The `handleUrlSubmit` itself primarily sets the filename and calls `loadFileContent`.

      // Let's refine the test to focus on the effects of `handleUrlSubmit`:
      // 1. Filename state is updated.
      // 2. `loadFileContent` is called, which uses the mocked `readUrl`.

      // To test `handleUrlSubmit` more directly without relying on UI interaction with a child component:
      // We can't directly call `handleUrlSubmit` as it's internal.
      // We can, however, verify that if `loadFileContent` is called with a URL, the display updates.
      // The `filename` part of `handleUrlSubmit` is the main new logic there.

      // Let's assume the `UrlLoader` component is mocked at the top level of the test file.
      // If not, these tests will be more integration-style.
      // For now, we will rely on the fact that handleUrlSubmit correctly calls loadFileContent,
      // and loadFileContent uses the mocked readUrl.

      // Simulate a URL submission. We need a way to trigger `handleUrlSubmit`.
      // If `UrlLoader` was deeply mocked to expose its `onUrlSubmit` prop:
      // const { result } = renderHook(() => useTouchstoneViewerHook()); // if it was a hook
      // For now, let's assume the UI interaction path:
      // (This would require UrlLoader to be rendered and interactive in the test)
      // fireEvent.click(screen.getByRole('button', { name: /Open from URL/i })); // From UrlLoader
      // fireEvent.change(screen.getByPlaceholderText(/Enter Touchstone file URL/i), { target: { value: mockUrlLoaderSubmitUrl } });
      // fireEvent.click(screen.getByRole('button', { name: /Load URL/i }));
      // This path is not available as UrlLoader is not part of this isolated test's direct render output in a way we can easily control its internals.

      // Alternative: Test the behavior of `loadFileContent` which `handleUrlSubmit` uses.
      // We can't call `handleUrlSubmit` directly.
      // We can't easily simulate `UrlLoader` submitting.
      // What we *can* do is mock `readUrl` for the new URL and then somehow trigger a load.
      // The component already loads '/sample.s2p'.
      // We'd need a new instance or a way to trigger a new load.

      // Given the constraints, the best way is to assume `handleUrlSubmit` is correctly wired
      // if `UrlLoader` is correctly implemented (tested in `UrlLoader.test.tsx`).
      // Then, we verify that if `readUrl` is called with a new URL, the component behaves.
      // The existing tests for `loadFileContent` (via default load) cover the `readUrl` part.
      // The main thing `handleUrlSubmit` adds is filename extraction.

      // To properly test this, we would need to:
      // 1. Render TouchstoneViewer.
      // 2. Simulate UrlLoader calling its `onUrlSubmit` prop, which is `handleUrlSubmit` in TouchstoneViewer.
      // This requires either a deep mock of UrlLoader or a way to get the `handleUrlSubmit` function.

      // Let's simplify: if `readUrl` is called with `mockUrlLoaderSubmitUrl` and resolves,
      // the filename should appear as "test.s2p" and data should display.
      // We can't *force* `readUrl` to be called with a *new* URL easily after initial load without UI.

      // This test will be more of an integration test if we assume UrlLoader is present.
      // For a unit test of TouchstoneViewer, we assume UrlLoader passes the URL correctly.
      // The critical part is how `TouchstoneViewer` *handles* that URL.

      // Let's assume we find a way to trigger `handleUrlSubmit`.
      // The component itself doesn't expose it to the test environment.
      // We'll proceed by verifying the effects if `loadFileContent` (which `handleUrlSubmit` calls)
      // is invoked with a new URL. The existing default load test covers `loadFileContent`.
      // The new aspect is the filename derived from the URL.

      // The `filename` state is updated by `handleUrlSubmit` *before* calling `loadFileContent`.
      // And `loadFileContent` uses the `filename` state for error/loading messages.

      // To test this properly, we need to modify the component or how it's tested.
      // For now, let's assume `handleUrlSubmit` is correctly implemented and it calls `loadFileContent`.
      // We'll test the outcome of `loadFileContent` being called with a new URL, and that the filename
      // (set by `handleUrlSubmit`) is used in messages.

      // This is becoming complicated due to the encapsulation.
      // A pragmatic approach:
      // The `TouchstoneViewer` receives `onUrlSubmit` from `UrlLoader`.
      // We are testing `TouchstoneViewer`. We don't have `UrlLoader`'s instance here easily.
      // The `handleUrlSubmit` function *itself* is what we want to test.
      // It sets `filename` and calls `loadFileContent`.
      // `loadFileContent` calls `readUrl`.

      // If we re-render, the `useEffect` for default load will run.
      // We need to test the state *after* `handleUrlSubmit` would have been called.

      // Test scenario:
      // 1. `TouchstoneViewer` is rendered. Default load occurs.
      // 2. Simulate `UrlLoader` providing a new URL. This internally calls `handleUrlSubmit(newUrl)`.
      // 3. `handleUrlSubmit` sets `filename` to "test.s2p".
      // 4. `handleUrlSubmit` calls `loadFileContent(newUrl)`.
      // 5. `loadFileContent` calls `mockReadUrl(newUrl)`.
      // 6. UI updates with "Data from test.s2p" and new data.

      // We can't directly call `handleUrlSubmit`.
      // We *can* check if the component correctly updates its display if `readUrl` is called
      // with a new URL and resolves, and if the filename display logic is correct.
      // The challenge is triggering that second call to `readUrl` via the intended path.

      // Let's assume we can mock `UrlLoader` to call `onUrlSubmit` upon a button click.
      // This is done in the new `UrlLoader.test.tsx` for `UrlLoader` itself.
      // For `TouchstoneViewer.test.tsx`, we need to mock `UrlLoader` *as a child*.

      // Revisit the mock strategy for UrlLoader as a child:
      // jest.mock('./components/UrlLoader', () => jest.fn(({ onUrlSubmit }) => <button onClick={() => onUrlSubmit('http://mock.com/file.s2p')}>Mocked UrlLoader Submit</button>));
      // This was the strategy in the *deleted* test file. Let's re-adopt a similar Vitest strategy.
      // (This will be added at the top of the file later)

      // Assuming UrlLoader is mocked to provide a button that calls onUrlSubmit:
      // (The mock for UrlLoader needs to be defined at the top for this to work)
      // (The mock for UrlLoader needs to be defined at the top for this to work)
      fireEvent.click(screen.getByTestId('mock-urllloader-submit'));

      // Check for filename update from handleUrlSubmit and data from mockUrlTs
      await waitFor(() => {
        expect(screen.getByText(/Data from test.s2p/i)).toBeInTheDocument();
      });
      expect(screen.getByText("3.0000")).toBeInTheDocument(); // Frequency from mockUrlTs
      expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      expect(mockReadUrl).toHaveBeenCalledWith('http://example.com/test.s2p');
    });

    it('displays an error if loading from URL fails (network error)', async () => {
      mockReadUrl.mockRejectedValueOnce(new Error('Simulated network error for URL'));

      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      // Simulate UrlLoader submitting the URL that will cause a network error
      fireEvent.click(screen.getByTestId('mock-urllloader-submit'));

      // Check for filename update first (from handleUrlSubmit calling setFilename)
      // Then check for the error message from readUrl failure (handled by loadFileContent)
      await waitFor(() => {
        // filename is set to 'test.s2p' by handleUrlSubmit before loadFileContent fails
        expect(screen.getByText(/Error with test.s2p/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Error: Simulated network error for URL/i)).toBeInTheDocument();
      expect(mockReadUrl).toHaveBeenCalledWith('http://example.com/test.s2p');
    });

    it('displays an error if file content from URL is invalid', async () => {
      mockReadUrl.mockRejectedValueOnce(new Error('Invalid Touchstone file format: Missing # line'));

      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      // Simulate UrlLoader submitting the URL
      fireEvent.click(screen.getByTestId('mock-urllloader-submit'));

      await waitFor(() => {
        expect(screen.getByText(/Error with test.s2p/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Error: Invalid Touchstone file format: Missing # line/i)).toBeInTheDocument();
      expect(mockReadUrl).toHaveBeenCalledWith('http://example.com/test.s2p');
    });

    it('extracts and displays filename correctly from complex URL', async () => {
      const complexUrl = 'https://raw.githubusercontent.com/some/path/filename%20with%20spaces.s3p?query=param';
      const expectedFilename = 'filename%20with%20spaces.s3p'; // As extracted by the component's logic
      const mockTs = createTouchstoneFromString(`! Mock S3P\n# HZ S RI R 50\n1 0 0 0 0 0 0 0 0 0`);
      // Ensure readUrl is mocked for the specific complex URL
      mockReadUrl.mockImplementation(async (urlToLoad: string) => {
        if (urlToLoad === complexUrl) {
          return mockTs;
        }
        // Fallback for default load or other URLs if necessary
        const defaultTs = createTouchstoneFromString(mockSampleS2PContent);
        return defaultTs;
      });


      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument());

      // Simulate UrlLoader submitting this complex URL via the specific button
      fireEvent.click(screen.getByTestId('mock-urllloader-submit-complex'));

      await waitFor(() => {
        expect(screen.getByText(`Data from ${expectedFilename}`)).toBeInTheDocument();
      });
      expect(mockReadUrl).toHaveBeenCalledWith(complexUrl);
    });
  });
})
