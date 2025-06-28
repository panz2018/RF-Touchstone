import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import FilenameEditor from '../../../src/components/fileinfo/FilenameEditor';

describe('FilenameEditor Component', () => {
  it('renders with initial filename and calls onFilenameChange', () => {
    const mockOnFilenameChange = vi.fn();
    render(
      <FilenameEditor
        currentFilename="test.s2p"
        onFilenameChange={mockOnFilenameChange}
      />
    );
    const input = screen.getByLabelText('Editable Filename Base') as HTMLInputElement;
    expect(input.value).toBe('test');
    expect(screen.getByText('.s2p')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'newname' } });
    fireEvent.blur(input);
    expect(mockOnFilenameChange).toHaveBeenCalledWith('newname.s2p');
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('displays error if onFilenameChange throws', () => {
    const errMsg = "Parent error on filename change";
    mockOnFilenameChange.mockImplementation(() => {
      throw new Error(errMsg);
    });
     render(
      <FilenameEditor
        currentFilename="test.s2p"
        onFilenameChange={mockOnFilenameChange}
      />
    );
    const input = screen.getByLabelText('Editable Filename Base') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'newname' } });
    fireEvent.blur(input); // This will trigger onFilenameChange
    expect(screen.getByText(`Error: ${errMsg}`)).toBeInTheDocument();
  });

  it('displays error if basename is empty on blur', () => {
    render(
      <FilenameEditor
        currentFilename="test.s2p"
        onFilenameChange={mockOnFilenameChange}
      />
    );
    const input = screen.getByLabelText('Editable Filename Base') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  ' } }); // Whitespace only
    fireEvent.blur(input);
    expect(screen.getByText("Error: Filename base cannot be empty.")).toBeInTheDocument();
    expect(mockOnFilenameChange).not.toHaveBeenCalled();
    expect(input.value).toBe('test'); // Should revert
  });
});
