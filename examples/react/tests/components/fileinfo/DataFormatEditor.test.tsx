import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import DataFormatEditor from '../../../src/components/fileinfo/DataFormatEditor';
import { type TouchstoneFormat } from 'rf-touchstone';

describe('DataFormatEditor Component', () => {
  it('renders with initial format and calls onFormatChange', () => {
    const mockOnFormatChange = vi.fn();
    render(
      <DataFormatEditor
        currentFormat="RI"
        onFormatChange={mockOnFormatChange}
        disabled={false}
      />
    );
    const select = screen.getByLabelText('Data Format Selector') as HTMLSelectElement;
    expect(select.value).toBe('RI');

    fireEvent.change(select, { target: { value: 'MA' } });
    expect(mockOnFormatChange).toHaveBeenCalledWith('MA');
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('displays error when onFormatChange throws', () => {
    const errMsg = "Parent error on format change";
    mockOnFormatChange.mockImplementation(() => {
      throw new Error(errMsg);
    });
    render(
      <DataFormatEditor
        currentFormat="RI"
        onFormatChange={mockOnFormatChange}
        disabled={false}
      />
    );
    const select = screen.getByLabelText('Data Format Selector');
    fireEvent.change(select, { target: { value: 'MA' } });
    expect(screen.getByText(`Error: ${errMsg}`)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <DataFormatEditor
        currentFormat="RI"
        onFormatChange={vi.fn()}
        disabled={true}
      />
    );
    const select = screen.getByLabelText('Data Format Selector') as HTMLSelectElement;
    expect(select).toBeDisabled();
  });
});
