import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DataTable from '../src/components/DataTable';
import { Touchstone, Complex, Frequency, FrequencyUnits, TouchstoneFormat } from 'rf-touchstone';

// Mock document.createElement for download link
const mockLinkClick = vi.fn();
const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as Node));
const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as Node));
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/mock-blob-url');
const mockRevokeObjectURL = vi.fn();

describe('DataTable Component', () => {
  let mockTouchstone: Touchstone;
  let mockSetMatrix: ReturnType<typeof vi.fn>;
  let mockSetFilename: ReturnType<typeof vi.fn>;
  const initialFilename = "test_data.s2p";

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const link = {
          href: '', download: '', click: mockLinkClick,
          setAttribute: vi.fn(), style: {},
        } as unknown as HTMLAnchorElement;
        return link;
      }
      return document.createElement(tagName);
    });

    mockTouchstone = new Touchstone();
    mockTouchstone.frequency = new Frequency([1e9, 2e9], 'Hz');
    mockTouchstone.format = 'RI';
    mockTouchstone.parameter = 'S';
    mockTouchstone.impedance = 50;
    mockTouchstone.nports = 2;
    mockTouchstone.matrix = [ // [to][from][freq]
      [ // S1x
        [new Complex(0.1, -0.1), new Complex(0.15, -0.15)], // S11 for 1GHz, 2GHz
        [new Complex(0.7, -0.05), new Complex(0.65, -0.08)]  // S12 for 1GHz, 2GHz
      ],
      [ // S2x
        [new Complex(2.0, -0.5), new Complex(1.9, -0.45)],  // S21 for 1GHz, 2GHz
        [new Complex(0.2, -0.2), new Complex(0.25, -0.25)]  // S22 for 1GHz, 2GHz
      ]
    ];
    mockTouchstone.comments = ["Test data for DataTable"];

    mockSetMatrix = vi.fn();
    mockSetFilename = vi.fn();
  });

  const renderTable = (ts = mockTouchstone, filename = initialFilename) => {
    render(
      <DataTable
        touchstone={ts}
        filename={filename}
        setMatrix={mockSetMatrix}
        setFilename={mockSetFilename}
      />
    );
  };

  describe('CSV Download', () => {
    it('generates correct CSV content for RI format with full precision', () => {
      renderTable();
      fireEvent.click(screen.getByRole('button', { name: /Download CSV/i }));

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const reader = new FileReader();

      return new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const csvContent = e.target?.result as string;
          expect(csvContent).toContain('Frequency (Hz),S11 (Real),S11 (Imaginary),S12 (Real),S12 (Imaginary),S21 (Real),S21 (Imaginary),S22 (Real),S22 (Imaginary)');
          expect(csvContent).toContain('1000000000,0.1,-0.1,0.7,-0.05,2,-0.5,0.2,-0.2');
          expect(csvContent).toContain('2000000000,0.15,-0.15,0.65,-0.08,1.9,-0.45,0.25,-0.25');
          resolve();
        };
        reader.readAsText(blob);
      });
    });

    it('generates correct CSV content for MA format (GHz)', () => {
      mockTouchstone.format = 'MA';
      mockTouchstone.frequency.unit = 'GHz'; // f_scaled will be 1, 2
      renderTable();
      fireEvent.click(screen.getByRole('button', { name: /Download CSV/i }));

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const reader = new FileReader();
      return new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const csvContent = e.target?.result as string;
          expect(csvContent).toContain('Frequency (GHz),S11 (Magnitude),S11 (Angle (°)),S12 (Magnitude),S12 (Angle (°)),S21 (Magnitude),S21 (Angle (°)),S22 (Magnitude),S22 (Angle (°))');
          // S11: 0.1 -0.1j -> Mag: sqrt(0.01+0.01) = sqrt(0.02) = 0.141421356... Angle: atan2(-0.1,0.1) = -45 deg
          expect(csvContent).toContain('1,0.1414213562373095,-45,'); // Check a few values
          resolve();
        };
        reader.readAsText(blob);
      });
    });

    it('triggers download with correct filename', () => {
      renderTable(mockTouchstone, "my_data.s2p");
      fireEvent.click(screen.getByRole('button', { name: /Download CSV/i }));
      expect(mockLinkClick).toHaveBeenCalled();
      const link = document.createElement('a'); // Mocked element
      expect(link.download).toBe('my_data.csv');
    });
  });

  // describe('CSV Upload', () => {
  //   // TODO: Add tests for parseCSV (complex) and handleCsvFileSelect
  //   // This will require mocking FileReader and creating sample CSV strings
  //   // for RI, MA, DB formats and testing header validation and data conversion.
  // });
});
