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
    readUrl: vi.fn(),
    readFile: vi.fn(),
  };
});

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

    // Default mock for readUrl to successfully load sample.s2p
    const defaultTs = createTouchstoneFromString(mockSampleS2PContent);
    mockReadUrl.mockResolvedValue(defaultTs);

    // Keep fetch mock for other potential uses or if readUrl actual implementation is tested
    ;(global.fetch as vi.Mock).mockImplementation((url: string) => {
      if (url.endsWith('sample.s2p')) { // This might be redundant if readUrl is always mocked
        return Promise.resolve({
          ok: true,
          statusText: 'OK',
          text: () => Promise.resolve(mockSampleS2PContent),
        })
      }
      return Promise.reject(new Error('File not found by fetch mock'))
    })

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
    expect(screen.getByText(/Loading sample.s2p.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(mockReadUrl).toHaveBeenCalledWith('/sample.s2p');
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
    await waitFor(() => {
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(uploadedFile);
      expect(
        screen.getByText(/Currently displaying: Data from uploaded.s2p/i)
      ).toBeInTheDocument()
      expect(screen.getByDisplayValue(uploadedTs.frequency!.unit)).toBeInTheDocument()
      expect(screen.getByText(uploadedTs.resistance + ' Ohms')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Frequency
      expect(screen.getAllByText('0.5000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('10.0000').length).toBeGreaterThan(0)
    })
  })

  it('handles and displays error for an invalid uploaded file', async () => {
    const invalidFile = new File([mockInvalidFileContent], 'invalid.s2p', {
      type: 'text/plain',
    })
    mockReadFile.mockRejectedValueOnce(new Error('Mocked read error for invalid file'));

    render(<TouchstoneViewer />);
    await waitFor(() => {
      // Initial load still happens
      expect(mockReadUrl).toHaveBeenCalled();
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(invalidFile);
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
      expect(mockReadUrl).toHaveBeenCalled();
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [emptyFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(emptyFile);
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
      expect(mockReadUrl).toHaveBeenCalled();
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i)
    fireEvent.change(fileInput, { target: { files: [errorFile] } })

    await waitFor(() => {
      expect(mockReadFile).toHaveBeenCalledWith(errorFile);
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
})
