import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// Import the module to mock its exports
import * as TouchstoneViewerModule from '../src/TouchstoneViewer';
import TouchstoneViewer from '../src/TouchstoneViewer' // Default export for rendering
import { Touchstone } from 'rf-touchstone'

// Mock specific functions from TouchstoneViewer.tsx's module scope (like readUrl, readFile)
// This allows us to control their behavior within TouchstoneViewer's own logic.
vi.mock('../src/TouchstoneViewer', async (importOriginal) => {
  const actual = await importOriginal<typeof TouchstoneViewerModule>();
  return {
    ...actual,
    readUrl: vi.fn(),
    readFile: vi.fn(),
  };
});

// --- Mock Child Components ---
// Mock UrlLoader
let mockTriggerUrlSubmit: ((url: string) => void) | null = null;
vi.mock('../src/components/UrlLoader', () => ({
  default: vi.fn(({ onUrlSubmit }) => {
    mockTriggerUrlSubmit = onUrlSubmit; // Expose the callback for tests
    return (
      <div data-testid="mock-urlloader">
        <button onClick={() => onUrlSubmit('http://default-mock-url.com/file.s2p')}>Mock UrlLoader Submit</button>
      </div>
    );
  }),
}));

// Mock FileInfo
let mockTriggerFilenameChange: ((newName: string) => void) | null = null;
let mockTriggerCommentsChange: ((newComments: string[]) => void) | null = null;
vi.mock('../src/components/FileInfo', () => ({
  default: vi.fn((props) => {
    // Expose callbacks for tests to simulate user interaction within FileInfo
    mockTriggerFilenameChange = props.handleFilenameChange;
    mockTriggerCommentsChange = props.handleCommentsChange;
    return (
      <div data-testid="mock-fileinfo">
        <span>Filename: {props.filename}</span>
        <span>Comments: {props.comments.join('/')}</span>
        {/* Minimal representation of other props for verification if needed */}
        <span>Unit: {props.unit}</span>
        <span>Format: {props.format}</span>
        <span>Touchstone NPorts: {props.touchstone?.nports}</span>
      </div>
    );
  }),
}));

// Mock CopyButton
vi.mock('../src/components/CopyButton', () => ({
  default: vi.fn(({ touchstone }) => (
    <button data-testid="mock-copybutton" disabled={!touchstone}>
      Mock Copy Button (Data: {touchstone ? 'Present' : 'Absent'})
    </button>
  )),
}));

// Mock DownloadButton
vi.mock('../src/components/DownloadButton', () => ({
  default: vi.fn(({ touchstone, filename }) => (
    <button data-testid="mock-downloadbutton" disabled={!touchstone}>
      Mock Download Button for {filename} (Data: {touchstone ? 'Present' : 'Absent'})
    </button>
  )),
}));


// --- Global Mocks (fetch, clipboard, URL object) ---
global.fetch = vi.fn(); // General fetch mock, specific behavior in readUrl mock if needed

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
  writable: true,
});

global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();


// --- Test Data & Helpers ---
const mockSampleS2PContent = `! Sample S2P File
! Original Comment 1
# HZ S RI R 50
1000000000 0.9 -0.1 0.01 0.02 0.01 0.02 0.8 -0.15
2000000000 0.8 -0.2 0.02 0.03 0.02 0.03 0.7 -0.25`;

const mockInvalidFileContent = `! Invalid data`;

const createTouchstoneFromString = (content: string, nports = 2): Touchstone => {
  const ts = new Touchstone();
  ts.readContent(content, nports);
  return ts;
};


// --- Test Suite ---
describe('TouchstoneViewer Component', () => {
  // Get typed access to the mocked module-level functions
  const mockedReadUrl = TouchstoneViewerModule.readUrl as vi.Mock;
  const mockedReadFile = TouchstoneViewerModule.readFile as vi.Mock;

  // Get typed access to the mocked child components
  const MockedFileInfo = TouchstoneViewerModule.default.FileInfo as unknown as vi.Mock;
  const MockedCopyButton = TouchstoneViewerModule.default.CopyButton as unknown as vi.Mock;
  const MockedDownloadButton = TouchstoneViewerModule.default.DownloadButton as unknown as vi.Mock;


  beforeEach(() => {
    vi.clearAllMocks(); // Clears call counts, mock implementations, etc.

    // Default behavior for readUrl (used for initial load)
    const initialTs = createTouchstoneFromString(mockSampleS2PContent);
    mockedReadUrl.mockImplementation(async (url: string) => {
      if (url === '/sample.s2p') {
        return initialTs;
      }
      // Allows specific tests to set their own mockResolvedValueOnce or mockImplementation for other URLs
      // If not specifically mocked, this will make the promise reject.
      return Promise.reject(new Error(`mockReadUrl received unexpected URL: ${url}. Test needs to mock this call.`));
    });

    // Default behavior for readFile (can be overridden in specific tests)
    mockedReadFile.mockResolvedValue(createTouchstoneFromString("! Mocked by readFile"));
  });

  it('renders initial state, loads default file, and passes correct props to children', async () => {
    render(<TouchstoneViewer />);

    // Initial UI elements
    expect(screen.getByText(/Touchstone File Viewer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload a Touchstone file/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-urlloader')).toBeInTheDocument(); // Check that UrlLoader mock is rendered

    // Wait for initial load to complete (sample.s2p)
    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    // Check that child components are rendered
    expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument();
    expect(screen.getByTestId('mock-copybutton')).toBeInTheDocument();
    expect(screen.getByTestId('mock-downloadbutton')).toBeInTheDocument();

    // Verify props passed to FileInfo after initial load
    const fileInfoProps = (await vi.mocked(FileInfo).mock.calls[0][0]) as any;
    expect(fileInfoProps.filename).toBe('sample.s2p');
    expect(fileInfoProps.comments).toEqual(['Original Comment 1']); // From mockSampleS2PContent
    expect(fileInfoProps.touchstone).toBeInstanceOf(Touchstone);
    expect(fileInfoProps.touchstone.comments).toEqual(['Original Comment 1']);

    // Verify props for CopyButton and DownloadButton
    const copyButtonProps = (await vi.mocked(CopyButton).mock.calls[0][0]) as any;
    expect(copyButtonProps.touchstone).toBeInstanceOf(Touchstone);

    const downloadButtonProps = (await vi.mocked(DownloadButton).mock.calls[0][0]) as any;
    expect(downloadButtonProps.touchstone).toBeInstanceOf(Touchstone);
    expect(downloadButtonProps.filename).toBe('sample.s2p');
  });

  it('handles filename change from FileInfo', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p')); // Wait for initial load

    // Simulate FileInfo calling handleFilenameChange
    const newFilenameFromChild = 'userEditedName.s2p';
    expect(mockTriggerFilenameChange).toBeDefined(); // Make sure the mock callback is set
    if(mockTriggerFilenameChange) {
      fireEvent.click(document.body); // To ensure any previous blur events are done (though not strictly needed here)
      await act(async () => {
         mockTriggerFilenameChange(newFilenameFromChild);
      });
    }

    // Check if filename state in TouchstoneViewer updated and passed to DownloadButton
    await waitFor(async () => {
      const downloadButtonProps = (await vi.mocked(DownloadButton).mock.lastCall[0]) as any;
      expect(downloadButtonProps.filename).toBe(newFilenameFromChild);
      expect(screen.getByText(`Mock Download Button for ${newFilenameFromChild}`)).toBeInTheDocument();
      expect(screen.getByText(/Currently displaying: Data from userEditedName.s2p/i)).toBeInTheDocument();
    });
  });

  it('handles comments change from FileInfo and updates touchstone object for copy/download', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p')); // Initial load

    // Original comments from sample.s2p
    const initialLoadedTs = createTouchstoneFromString(mockSampleS2PContent);
    let copyButtonProps = (await vi.mocked(CopyButton).mock.calls[0][0]) as any;
    expect(copyButtonProps.touchstone.comments).toEqual(initialLoadedTs.comments);

    // Simulate FileInfo calling handleCommentsChange
    const newCommentsFromChild = ['User comment 1', 'User comment 2'];
    expect(mockTriggerCommentsChange).toBeDefined();
    if(mockTriggerCommentsChange) {
       await act(async () => {
        mockTriggerCommentsChange(newCommentsFromChild);
      });
    }

    // Verify the touchstone object passed to CopyButton (and DownloadButton) is updated
    // This tests the useEffect that syncs editableComments to the main touchstone object
    await waitFor(async () => {
      copyButtonProps = (await vi.mocked(CopyButton).mock.lastCall[0]) as any;
      expect(copyButtonProps.touchstone).toBeInstanceOf(Touchstone);
      expect(copyButtonProps.touchstone.comments).toEqual(newCommentsFromChild);

      const downloadButtonProps = (await vi.mocked(DownloadButton).mock.lastCall[0]) as any;
      expect(downloadButtonProps.touchstone.comments).toEqual(newCommentsFromChild);
    });

    // Also check if FileInfo received the updated comments
    await waitFor(async () => {
        const fileInfoProps = (await vi.mocked(FileInfo).mock.lastCall[0]) as any;
        expect(fileInfoProps.comments).toEqual(newCommentsFromChild);
    });
  });

  // --- Existing tests for file loading, error handling, format/unit switching ---
  // These should still pass or be slightly adapted if prop names to FileInfo changed.
  // The core logic of loading/parsing (which uses mocked readUrl/readFile) remains.

  it('displays parsed data from the default sample file', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => {
      // Check for data rendered by DataTable (assuming it displays these values)
      // This part is indirect; actual values depend on DataTable implementation
      // For now, checking FileInfo's display of touchstone properties is more direct via its mock
      const fileInfoProps = (vi.mocked(FileInfo).mock.calls[0][0]) as any;
      expect(fileInfoProps.touchstone.nports).toBe(2);
      expect(fileInfoProps.touchstone.frequency.f_Hz[0]).toBe(1000000000);
    });
  });

  it('handles local file upload and displays new data, without calling readUrl', async () => {
    const mockUploadedFileContent = `! Uploaded S2P File\n# GHZ S MA R 75\n1 0.5 10 0.05 20 0.05 20 0.4 30`;
    const uploadedFile = new File([mockUploadedFileContent], 'uploaded.s2p', { type: 'text/plain' });
    const uploadedTs = createTouchstoneFromString(mockUploadedFileContent);
    uploadedTs.comments = []; // Assuming uploaded file has no comments for this test
    mockedReadFile.mockResolvedValue(uploadedTs);

    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p')); // Initial load
    mockedReadUrl.mockClear(); // Clear after initial load

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } });

    await waitFor(() => {
      expect(mockedReadFile).toHaveBeenCalledWith(uploadedFile);
      expect(mockedReadUrl).not.toHaveBeenCalled(); // Crucial check
      expect(screen.getByText(/Currently displaying: Data from uploaded.s2p/i)).toBeInTheDocument();

      const fileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
      expect(fileInfoProps.filename).toBe('uploaded.s2p');
      expect(fileInfoProps.touchstone.parameter).toBe('S'); // From uploadedTs
      expect(fileInfoProps.touchstone.frequency.unit).toBe('GHz');
      expect(fileInfoProps.comments).toEqual([]); // Comments from uploadedTs
    });
  });

  it('handles error for an invalid uploaded local file', async () => {
    const invalidFile = new File([mockInvalidFileContent], 'invalid.s2p', { type: 'text/plain' });
    mockedReadFile.mockRejectedValueOnce(new Error('Local read error'));

    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p'));
    mockedReadUrl.mockClear();

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(mockedReadFile).toHaveBeenCalledWith(invalidFile);
      expect(mockedReadUrl).not.toHaveBeenCalled();
      expect(screen.getByText(/Error with invalid.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: Local read error/i)).toBeInTheDocument();
    });
  });

  it('handles URL submission, loads data, and updates children props', async () => {
    const urlSubmitted = 'http://new-url.com/data.s1p';
    const tsFromUrl = createTouchstoneFromString("! From URL\n# MHZ S DB R 50\n100 0 -90 0 0", 1);
    tsFromUrl.comments = ["URL comment"];
    mockedReadUrl.mockResolvedValueOnce(tsFromUrl); // Specific mock for this URL

    render(<TouchstoneViewer />);
    await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i))); // Initial load done

    expect(mockTriggerUrlSubmit).toBeDefined();
    if (mockTriggerUrlSubmit) {
      await act(async () => {
        mockTriggerUrlSubmit(urlSubmitted);
      });
    }

    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith(urlSubmitted);
      expect(screen.getByText(/Currently displaying: Data from data.s1p/i)).toBeInTheDocument();

      const fileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
      expect(fileInfoProps.filename).toBe('data.s1p');
      expect(fileInfoProps.comments).toEqual(["URL comment"]);
      expect(fileInfoProps.touchstone.frequency.unit).toBe('MHz');

      const copyButtonProps = (vi.mocked(CopyButton).mock.lastCall[0]) as any;
      expect(copyButtonProps.touchstone.comments).toEqual(["URL comment"]);

      const downloadButtonProps = (vi.mocked(DownloadButton).mock.lastCall[0]) as any;
      expect(downloadButtonProps.touchstone.comments).toEqual(["URL comment"]);
      expect(downloadButtonProps.filename).toBe('data.s1p');
    });
  });

  it('handles error when loading from URL', async () => {
    const urlWithError = 'http://bad-url.com/error.s2p';
    mockedReadUrl.mockRejectedValueOnce(new Error('URL fetch failed'));

    render(<TouchstoneViewer />);
    await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)));

    expect(mockTriggerUrlSubmit).toBeDefined();
    if (mockTriggerUrlSubmit) {
      await act(async () => {
        mockTriggerUrlSubmit(urlWithError);
      });
    }

    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith(urlWithError);
      expect(screen.getByText(/Error with error.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: URL fetch failed/i)).toBeInTheDocument();
    });
  });

  // Snapshot test (optional, but can be useful)
  it('matches snapshot with loaded data and mocked children', async () => {
    const { container } = render(<TouchstoneViewer />);
    await waitFor(() => screen.getByTestId('mock-fileinfo')); // Wait for children to render
    expect(container.firstChild).toMatchSnapshot();
  });

  // Tests for format and unit switching can remain, they interact with FileInfo mock
  // but the core logic is in TouchstoneViewer.
  describe('Format and Unit Switching via Mocked FileInfo', () => {
    it('updates format when simulated from FileInfo', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument());

      const fileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
      expect(fileInfoProps.format).toBe('RI'); // Initial

      act(() => {
        fileInfoProps.handleFormatChange('MA');
      });

      await waitFor(() => {
        const updatedFileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
        expect(updatedFileInfoProps.format).toBe('MA');
      });
    });

    it('updates unit when simulated from FileInfo', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument());

      const fileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
      expect(fileInfoProps.unit).toBe('HZ'); // Initial from mockSampleS2PContent

      act(() => {
        fileInfoProps.handleUnitChange('KHz');
      });

      await waitFor(() => {
        const updatedFileInfoProps = (vi.mocked(FileInfo).mock.lastCall[0]) as any;
        expect(updatedFileInfoProps.unit).toBe('KHz');
      });
    });
  });
});
