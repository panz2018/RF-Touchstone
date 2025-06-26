import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react' // Added act
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// Import the module to mock its exports
import * as TouchstoneViewerModule from '../src/TouchstoneViewer';
import TouchstoneViewer from '../src/TouchstoneViewer' // Default export for rendering
import { Touchstone } from 'rf-touchstone'

// Mock specific functions from TouchstoneViewer.tsx's module scope (like readUrl, readFile)
vi.mock('../src/TouchstoneViewer', async (importOriginal) => {
  const actual = await importOriginal<typeof TouchstoneViewerModule>();
  return {
    ...actual,
    readUrl: vi.fn(),
    readFile: vi.fn(),
  };
});

// --- Mock Child Components ---
let mockTriggerUrlSubmit: ((url: string) => void) | null = null;
vi.mock('../src/components/UrlLoader', () => ({
  default: vi.fn(({ onUrlSubmit }) => {
    mockTriggerUrlSubmit = onUrlSubmit;
    return (
      <div data-testid="mock-urlloader">
        <button onClick={() => { if (mockTriggerUrlSubmit) mockTriggerUrlSubmit('http://default-mock-url.com/file.s2p'); }}>
            Mock UrlLoader Submit
        </button>
      </div>
    );
  }),
}));

// Mock DataTable
let mockTriggerMatrixUpdateFromCsv: ((matrix: Complex[][][], frequencies: number[], filename: string) => void) | null = null;
vi.mock('../src/components/DataTable', () => ({
  default: vi.fn((props) => {
    // Expose a way to simulate CSV upload calling setMatrix and setFilename
    mockTriggerMatrixUpdateFromCsv = (matrix, frequencies, newFilename) => {
      props.setMatrix(matrix, frequencies);
      props.setFilename(newFilename);
    };
    return (
      <div data-testid="mock-datatable">
        <span>Mock DataTable (File: {props.filename})</span>
        {/* Button to simulate download, not strictly needed for these tests but good for completeness */}
        <button data-testid="mock-datatable-download-csv">Download CSV</button>
        {/* Input to simulate upload */}
        <input type="file" data-testid="mock-datatable-upload-csv" />
      </div>
    );
  }),
}));

let mockTriggerFilenameChange: ((newName: string) => void) | null = null;
// mockTriggerCommentsChange, mockTriggerUnitChange, mockTriggerFormatChange will be set via props
let mockFileInfoHandlers: any = {};
vi.mock('../src/components/FileInfo', () => ({
  default: vi.fn((props) => {
    mockTriggerFilenameChange = props.handleFilenameChange; // Still used for filename
    // Store all handlers passed to the mock to be triggered by tests
    mockFileInfoHandlers.setUnit = props.setUnit;
    mockFileInfoHandlers.setFormat = props.setFormat;
    mockFileInfoHandlers.setComments = props.setComments;

    // The mocked FileInfo now derives unit, format, comments from the touchstone prop
    const displayUnit = props.touchstone?.frequency?.unit || 'N/A';
    const displayFormat = props.touchstone?.format || 'N/A';
    const displayComments = (props.touchstone?.comments || []).join('/');

    return (
      <div data-testid="mock-fileinfo">
        <span>Filename: {props.filename}</span>
        <span>Comments: {displayComments}</span>
        <span>Unit: {displayUnit}</span>
        <span>Format: {displayFormat}</span>
        <span>Touchstone NPorts: {props.touchstone?.nports}</span>
        {/* Buttons to simulate FileInfo triggering parent handlers with new prop names */}
        <button data-testid="mock-fileinfo-set-unit" onClick={() => props.setUnit('MockNewUnit')} />
        <button data-testid="mock-fileinfo-set-format" onClick={() => props.setFormat('MockNewFormat')} />
        <button data-testid="mock-fileinfo-set-comments" onClick={() => props.setComments(['MockNewComment'])} />
      </div>
    );
  }),
}));

vi.mock('../src/components/CopyButton', () => ({
  default: vi.fn(({ touchstone }) => (
    <button data-testid="mock-copybutton" disabled={!touchstone}>
      Mock Copy Button (Data: {touchstone ? 'Present' : 'Absent'})
    </button>
  )),
}));

vi.mock('../src/components/DownloadButton', () => ({
  default: vi.fn(({ touchstone, filename }) => (
    <button data-testid="mock-downloadbutton" disabled={!touchstone}>
      Mock Download Button for {filename} (Data: {touchstone ? 'Present' : 'Absent'})
    </button>
  )),
}));

global.fetch = vi.fn();
Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, writable: true });
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

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

describe('TouchstoneViewer Component', () => {
  const mockedReadUrl = TouchstoneViewerModule.readUrl as vi.Mock;
  const mockedReadFile = TouchstoneViewerModule.readFile as vi.Mock;

  const MockedFileInfo = vi.mocked(FileInfo);
  const MockedCopyButton = vi.mocked(CopyButton);
  const MockedDownloadButton = vi.mocked(DownloadButton);
  const MockedDataTable = vi.mocked(DataTable); // Added mock for DataTable

  beforeEach(() => {
    vi.clearAllMocks();
    const initialTs = createTouchstoneFromString(mockSampleS2PContent);
    mockedReadUrl.mockImplementation(async (url: string) => {
      if (url === '/sample.s2p') return initialTs;
      return Promise.reject(new Error(`mockReadUrl received unexpected URL: ${url}.`));
    });
    mockedReadFile.mockResolvedValue(createTouchstoneFromString("! Mocked by readFile"));
  });

  it('renders initial state, loads default file, and passes correct props to children', async () => {
    render(<TouchstoneViewer />);
    expect(screen.getByText(/Touchstone File Viewer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload a Touchstone file/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-urlloader')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p');
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument();
    expect(screen.getByTestId('mock-copybutton')).toBeInTheDocument();
    expect(screen.getByTestId('mock-downloadbutton')).toBeInTheDocument();
    expect(screen.getByTestId('mock-datatable')).toBeInTheDocument(); // Check DataTable mock is rendered

    const fileInfoProps = MockedFileInfo.mock.calls[0][0] as any;
    expect(fileInfoProps.filename).toBe('sample.s2p');
    expect(fileInfoProps.touchstone).toBeInstanceOf(Touchstone);
    expect(fileInfoProps.touchstone.comments).toEqual(['Original Comment 1']);
    // unit and format are now derived by the mock from fileInfoProps.touchstone
    // So, we check the mock's rendering rather than direct props for these
    expect(screen.getByText('Unit: HZ')).toBeInTheDocument(); // From mockSampleS2PContent
    expect(screen.getByText('Format: RI')).toBeInTheDocument(); // Default

    const copyButtonProps = MockedCopyButton.mock.calls[0][0] as any;
    expect(copyButtonProps.touchstone).toBeInstanceOf(Touchstone);

    const downloadButtonProps = MockedDownloadButton.mock.calls[0][0] as any;
    expect(downloadButtonProps.touchstone).toBeInstanceOf(Touchstone);
    expect(downloadButtonProps.filename).toBe('sample.s2p');

    // Verify props for DataTable
    const dataTableProps = MockedDataTable.mock.calls[0][0] as any;
    expect(dataTableProps.touchstone).toBeInstanceOf(Touchstone);
    expect(dataTableProps.filename).toBe('sample.s2p');
    expect(typeof dataTableProps.setMatrix).toBe('function');
    expect(typeof dataTableProps.setFilename).toBe('function');
  });

  it('handles filename change from FileInfo', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p'));

    const newFilenameFromChild = 'userEditedName.s2p';
    expect(mockTriggerFilenameChange).not.toBeNull();
    if(mockTriggerFilenameChange) {
      act(() => { mockTriggerFilenameChange(newFilenameFromChild); });
    }

    await waitFor(() => {
      const downloadButtonProps = MockedDownloadButton.mock.lastCall![0] as any;
      expect(downloadButtonProps.filename).toBe(newFilenameFromChild);
      expect(screen.getByText(`Mock Download Button for ${newFilenameFromChild}`)).toBeInTheDocument();
      expect(screen.getByText(/Currently displaying: Data from userEditedName.s2p/i)).toBeInTheDocument();
    });
  });

  it('handles comments change from FileInfo and updates touchstone object for copy/download', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p'));

    const initialLoadedTs = createTouchstoneFromString(mockSampleS2PContent);
    let copyButtonProps = MockedCopyButton.mock.calls[0][0] as any;
    expect(copyButtonProps.touchstone.comments).toEqual(initialLoadedTs.comments);

    const newCommentsFromChild = ['User comment 1', 'User comment 2'];
    expect(mockFileInfoHandlers.setComments).toBeDefined();
    if(mockFileInfoHandlers.setComments) {
       act(() => { mockFileInfoHandlers.setComments(newCommentsFromChild); });
    }

    await waitFor(() => {
      copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
      expect(copyButtonProps.touchstone.comments).toEqual(newCommentsFromChild);
      const downloadButtonProps = MockedDownloadButton.mock.lastCall![0] as any;
      expect(downloadButtonProps.touchstone.comments).toEqual(newCommentsFromChild);
    });

    // Verify the mock FileInfo displays the updated comments
    await waitFor(() => {
      expect(screen.getByText(`Comments: ${newCommentsFromChild.join('/')}`)).toBeInTheDocument();
      // Also ensure the touchstone object passed to FileInfo itself has updated comments
      const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
      expect(fileInfoProps.touchstone.comments).toEqual(newCommentsFromChild);
    });
  });

  it('displays parsed data from the default sample file', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => {
      const fileInfoProps = MockedFileInfo.mock.calls[0][0] as any;
      expect(fileInfoProps.touchstone.nports).toBe(2);
      expect(fileInfoProps.touchstone.frequency.f_Hz[0]).toBe(1000000000);
    });
  });

  it('handles local file upload and displays new data, without calling readUrl', async () => {
    const mockUploadedFileContent = `! Uploaded S2P File\n# GHZ S MA R 75\n1 0.5 10 0.05 20 0.05 20 0.4 30`;
    const uploadedFile = new File([mockUploadedFileContent], 'uploaded.s2p', { type: 'text/plain' });
    const uploadedTs = createTouchstoneFromString(mockUploadedFileContent);
    uploadedTs.comments = [];
    mockedReadFile.mockResolvedValue(uploadedTs);

    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p'));
    mockedReadUrl.mockClear();

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } });

    await waitFor(() => {
      expect(mockedReadFile).toHaveBeenCalledWith(uploadedFile);
      expect(mockedReadUrl).not.toHaveBeenCalled();
      expect(screen.getByText(/Currently displaying: Data from uploaded.s2p/i)).toBeInTheDocument();

      const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
      expect(fileInfoProps.filename).toBe('uploaded.s2p');
      expect(fileInfoProps.touchstone.parameter).toBe('S');
      expect(fileInfoProps.touchstone.frequency.unit).toBe('GHz');
      expect(fileInfoProps.comments).toEqual([]);
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
    mockedReadUrl.mockResolvedValueOnce(tsFromUrl);

    render(<TouchstoneViewer />);
    await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)));

    expect(mockTriggerUrlSubmit).not.toBeNull();
    if (mockTriggerUrlSubmit) {
      act(() => { mockTriggerUrlSubmit(urlSubmitted); });
    }

    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith(urlSubmitted);
      expect(screen.getByText(/Currently displaying: Data from data.s1p/i)).toBeInTheDocument();

      const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
      expect(fileInfoProps.filename).toBe('data.s1p');
      expect(fileInfoProps.comments).toEqual(["URL comment"]);
      expect(fileInfoProps.touchstone.frequency.unit).toBe('MHz');

      const copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
      expect(copyButtonProps.touchstone.comments).toEqual(["URL comment"]);

      const downloadButtonProps = MockedDownloadButton.mock.lastCall![0] as any;
      expect(downloadButtonProps.touchstone.comments).toEqual(["URL comment"]);
      expect(downloadButtonProps.filename).toBe('data.s1p');
    });
  });

  it('handles error when loading from URL', async () => {
    const urlWithError = 'http://bad-url.com/error.s2p';
    mockedReadUrl.mockRejectedValueOnce(new Error('URL fetch failed'));

    render(<TouchstoneViewer />);
    await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)));

    expect(mockTriggerUrlSubmit).not.toBeNull();
    if (mockTriggerUrlSubmit) {
      act(() => { mockTriggerUrlSubmit(urlWithError); });
    }

    await waitFor(() => {
      expect(mockedReadUrl).toHaveBeenCalledWith(urlWithError);
      expect(screen.getByText(/Error with error.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: URL fetch failed/i)).toBeInTheDocument();
    });
  });

  it('sets an error if filename cannot be derived from URL in loadFileContent', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(screen.getByText(/Data from sample.s2p/i)));

    const invalidUrl = " "; // An empty or invalid URL that results in no filename
    mockedReadUrl.mockClear();

    expect(mockTriggerUrlSubmit).not.toBeNull();
    if (mockTriggerUrlSubmit) {
      act(() => { mockTriggerUrlSubmit(invalidUrl); });
    }

    await waitFor(() => {
      expect(screen.getByText(`Error: Could not determine a valid filename from URL: ${invalidUrl}`)).toBeInTheDocument();
    });
    expect(mockedReadUrl).not.toHaveBeenCalled();

    const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
    expect(fileInfoProps.touchstone).toBeNull();
    const copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
    expect(copyButtonProps.touchstone).toBeNull();
  });

  it('matches snapshot with loaded data and mocked children', async () => {
    const { container } = render(<TouchstoneViewer />);
    await waitFor(() => screen.getByTestId('mock-fileinfo'));
    expect(container.firstChild).toMatchSnapshot();
  });

  describe('Format and Unit Switching via Mocked FileInfo', () => {
    it('updates format when simulated from FileInfo', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument());

      // Check initial format via the mock's display (derived from touchstone)
      expect(screen.getByText('Format: RI')).toBeInTheDocument();

      // Simulate FileInfo's internal mechanism calling setFormat
      fireEvent.click(screen.getByTestId('mock-fileinfo-set-format'));

      await waitFor(() => {
        // Verify the touchstone object passed to FileInfo (and thus its display) is updated
        expect(screen.getByText('Format: MockNewFormat')).toBeInTheDocument();
        const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
        expect(fileInfoProps.touchstone.format).toBe('MockNewFormat');

        // Also verify CopyButton gets the updated touchstone
        const copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
        expect(copyButtonProps.touchstone.format).toBe('MockNewFormat');
      });
    });

    it('updates unit when simulated from FileInfo', async () => {
      render(<TouchstoneViewer />);
      await waitFor(() => expect(screen.getByTestId('mock-fileinfo')).toBeInTheDocument());

      // Check initial unit via the mock's display
      expect(screen.getByText('Unit: HZ')).toBeInTheDocument();

      // Simulate FileInfo's internal mechanism calling setUnit
      fireEvent.click(screen.getByTestId('mock-fileinfo-set-unit'));

      await waitFor(() => {
        // Verify the touchstone object passed to FileInfo (and thus its display) is updated
        expect(screen.getByText('Unit: MockNewUnit')).toBeInTheDocument();
        const fileInfoProps = MockedFileInfo.mock.lastCall![0] as any;
        expect(fileInfoProps.touchstone.frequency.unit).toBe('MockNewUnit');

        // Also verify CopyButton gets the updated touchstone
        const copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
        expect(copyButtonProps.touchstone.frequency.unit).toBe('MockNewUnit');
      });
    });
  });

  it('updates touchstone matrix and filename when CSV data is uploaded via DataTable', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => expect(mockedReadUrl).toHaveBeenCalledWith('/sample.s2p')); // Initial load

    const newMatrix: Complex[][][] = [ [[new Complex(1,1)]], [[new Complex(2,2)]] ]; // Simplified 1-port matrix
    const newFrequencies = [3e9, 4e9];
    const newFilenameFromCsv = "uploaded_matrix.csv";

    expect(mockTriggerMatrixUpdateFromCsv).not.toBeNull();
    if (mockTriggerMatrixUpdateFromCsv) {
      act(() => {
        mockTriggerMatrixUpdateFromCsv(newMatrix, newFrequencies, newFilenameFromCsv);
      });
    }

    await waitFor(() => {
      // Check that filename displayed by TouchstoneViewer is updated
      expect(screen.getByText(`Currently displaying: Data from ${newFilenameFromCsv}`)).toBeInTheDocument();

      // Check that the new matrix and frequencies are reflected in props passed to children
      const dataTableProps = MockedDataTable.mock.lastCall![0] as any;
      expect(dataTableProps.touchstone.matrix).toEqual(newMatrix);
      expect(dataTableProps.touchstone.frequency.f_Hz).toEqual(newFrequencies.map(f => f * dataTableProps.touchstone.frequency.getMultiplier(dataTableProps.touchstone.frequency.unit))); // Assuming frequencies were passed in current unit
      expect(dataTableProps.filename).toBe(newFilenameFromCsv);

      const copyButtonProps = MockedCopyButton.mock.lastCall![0] as any;
      expect(copyButtonProps.touchstone.matrix).toEqual(newMatrix);
    });
  });
});
