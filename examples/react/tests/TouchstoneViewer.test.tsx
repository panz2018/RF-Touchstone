import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TouchstoneViewer from '../src/TouchstoneViewer';
import { Touchstone } from 'rf-touchstone'; // Actual import for integration parts

// Mocking fetch
global.fetch = vi.fn();

const createMockTouchstone = (isError = false): Touchstone | Error => {
  if (isError) {
    return new Error("Invalid Touchstone data");
  }
  const ts = new Touchstone();
  ts.type = 'S-PARAMETERS';
  ts.frequencyUnit = 'GHZ';
  ts.parameter = 'S';
  ts.format = 'RI';
  ts.resistance = 50;
  ts.comments = ['A sample comment'];
  ts.networkData = [
    { frequency: 1, parameters: [[{ magnitude: 0.1, angle: -10 }, { magnitude: 0.2, angle: -20 }], [{ magnitude: 0.3, angle: -30 }, { magnitude: 0.4, angle: -40 }]] },
    { frequency: 2, parameters: [[{ magnitude: 0.5, angle: -50 }, { magnitude: 0.6, angle: -60 }], [{ magnitude: 0.7, angle: -70 }, { magnitude: 0.8, angle: -80 }]] },
  ];
  ts.ports = 2; // Manually set ports based on data
  return ts;
};

const mockSampleS2PContent = `! Sample S2P File
# HZ S RI R 50
1000000000 0.9 -0.1 0.01 0.02 0.01 0.02 0.8 -0.15
2000000000 0.8 -0.2 0.02 0.03 0.02 0.03 0.7 -0.25`;

const mockInvalidFileContent = `! Invalid data`;

describe('TouchstoneViewer Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    (global.fetch as vi.Mock).mockImplementation((url: string) => {
      if (url.endsWith('sample.s2p')) {
        return Promise.resolve({
          ok: true,
          statusText: 'OK',
          text: () => Promise.resolve(mockSampleS2PContent),
        });
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  it('renders initial state correctly and loads default sample file', async () => {
    render(<TouchstoneViewer />);
    expect(screen.getByText(/Touchstone File Viewer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload a Touchstone file/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading sample.s2p.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    // Check for some data from the sample file (actual parsing by rf-touchstone)
    expect(screen.getByText('S-PARAMETERS')).toBeInTheDocument(); // Type
    expect(screen.getByText('HZ')).toBeInTheDocument(); // Frequency Unit
    expect(screen.getByText('RI')).toBeInTheDocument(); // Format
    expect(screen.getByText('50 Ohms')).toBeInTheDocument(); // Resistance
  });

  it('displays parsed data from the default sample file', async () => {
    render(<TouchstoneViewer />);
    await waitFor(() => {
      // Verify some table content based on mockSampleS2PContent
      expect(screen.getByText('1000000000')).toBeInTheDocument(); // Frequency
      expect(screen.getAllByText('0.9000').length).toBeGreaterThan(0); // S11 Mag (example)
      expect(screen.getAllByText('-0.1000').length).toBeGreaterThan(0); // S11 Angle (example)
    });
  });

  it('handles file upload and displays new data', async () => {
    const mockUploadedFileContent = `! Uploaded S2P File
# GHZ S MA R 75
1 0.5 10 0.05 20 0.05 20 0.4 30
`;
    const uploadedFile = new File([mockUploadedFileContent], 'uploaded.s2p', { type: 'text/plain' });
    const mockTs = Touchstone.fromString(mockUploadedFileContent);


    render(<TouchstoneViewer />);
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from uploaded.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(mockTs.frequencyUnit)).toBeInTheDocument();
      expect(screen.getByText(mockTs.resistance + ' Ohms')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Frequency from uploaded file
      expect(screen.getAllByText('0.5000').length).toBeGreaterThan(0); // S11 Mag from uploaded
    });
  });

  it('handles and displays error for an invalid uploaded file', async () => {
    const invalidFile = new File([mockInvalidFileContent], 'invalid.s2p', { type: 'text/plain' });

    render(<TouchstoneViewer />);
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Error with invalid.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: Unexpected character "#" at line 2, column 1/i)).toBeInTheDocument();
    });
  });

  it('handles and displays error for an empty uploaded file', async () => {
    const emptyFile = new File([''], 'empty.s2p', { type: 'text/plain' });

    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [emptyFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Error with empty.s2p/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: File content is empty./i)).toBeInTheDocument();
    });
  });


  it('handles fetch error when loading default sample file', async () => {
    (global.fetch as vi.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        statusText: 'Server Error',
        text: () => Promise.resolve('Cannot fetch'),
      })
    );

    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch file: Server Error/i)).toBeInTheDocument();
    });
  });

  it('handles FileReader error', async () => {
    const errorFile = new File(['some content'], 'error.s2p', { type: 'text/plain' });
    // Mock FileReader to simulate an error
    const mockReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsText: vi.fn().mockImplementation(function(this: FileReader) {
            if (this.onerror) {
                // Simulate an error event
                const errorEvent = new ProgressEvent('error') as any; // Cast to any to avoid type issues
                this.onerror(errorEvent);
            }
        }),
        result: '',
    };
    vi.spyOn(global, 'FileReader').mockImplementation(() => mockReader as any);


    render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/Upload a Touchstone file/i);
    fireEvent.change(fileInput, { target: { files: [errorFile] } });

    await waitFor(() => {
        expect(screen.getByText(/Error: Error reading file./i)).toBeInTheDocument();
    });
     // Restore original FileReader
    vi.restoreAllMocks();
  });


  it('matches snapshot with loaded data', async () => {
    const { container } = render(<TouchstoneViewer />);
    await waitFor(() => {
      expect(screen.getByText(/Currently displaying: Data from sample.s2p/i)).toBeInTheDocument();
    });
    // Expect the container to match snapshot after data is loaded
    expect(container.firstChild).toMatchSnapshot();
  });
});
