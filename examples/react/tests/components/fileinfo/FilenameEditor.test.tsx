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
  });
});
