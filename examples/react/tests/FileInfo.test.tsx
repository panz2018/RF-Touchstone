import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Though vitest uses its own matchers, this can be kept for familiarity or if jest-dom is configured
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileInfo from '../src/components/FileInfo';
import { Touchstone } from 'rf-touchstone';

// Minimal mock for Touchstone data needed by FileInfo
const mockTouchstoneInstance = new Touchstone();
mockTouchstoneInstance.nports = 2;
mockTouchstoneInstance.parameter = 'S';
mockTouchstoneInstance.impedance = 50;
mockTouchstoneInstance.frequency = { unit: 'GHz', f: [1], f_Hz: [1e9] } as any;
mockTouchstoneInstance.format = 'RI';
mockTouchstoneInstance.comments = ['Comment 1', 'Comment 2'];


describe('FileInfo Component', () => {
  let mockHandleFilenameChange: ReturnType<typeof vi.fn>;
  let mockHandleCommentsChange: ReturnType<typeof vi.fn>;
  let mockHandleUnitChange: ReturnType<typeof vi.fn>;
  let mockHandleFormatChange: ReturnType<typeof vi.fn>;

  const initialFilename = 'testfile.s2p';
  const initialComments = ['Initial comment 1', 'Initial comment 2'];

  beforeEach(() => {
    mockHandleFilenameChange = vi.fn();
    mockHandleCommentsChange = vi.fn();
    mockHandleUnitChange = vi.fn(); // Required prop, mock even if not directly tested here
    mockHandleFormatChange = vi.fn(); // Required prop, mock even if not directly tested here

    // Update mockTouchstoneInstance comments for each test if needed, or ensure it's consistent
    mockTouchstoneInstance.comments = [...initialComments];
  });

  const renderComponent = (filename = initialFilename, comments = initialComments) => {
    return render(
      <FileInfo
        touchstone={mockTouchstoneInstance}
        unit="GHz"
        handleUnitChange={mockHandleUnitChange}
        format="RI"
        handleFormatChange={mockHandleFormatChange}
        filename={filename}
        handleFilenameChange={mockHandleFilenameChange}
        comments={comments}
        handleCommentsChange={mockHandleCommentsChange}
      />
    );
  };

  describe('Filename Editing', () => {
    it('displays the initial filename correctly (basename and extension)', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile') as HTMLInputElement;
      expect(basenameInput).toBeInTheDocument();
      expect(screen.getByText('.s2p')).toBeInTheDocument();
    });

    it('allows editing the basename of the filename', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile') as HTMLInputElement;
      fireEvent.change(basenameInput, { target: { value: 'newBaseName' } });
      expect(basenameInput.value).toBe('newBaseName');
    });

    it('calls handleFilenameChange with the new full filename on blur if changed', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile');
      fireEvent.change(basenameInput, { target: { value: 'editedName' } });
      fireEvent.blur(basenameInput);
      expect(mockHandleFilenameChange).toHaveBeenCalledWith('editedName.s2p');
    });

    it('calls handleFilenameChange on Enter key press', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile');
      fireEvent.change(basenameInput, { target: { value: 'anotherName' } });
      fireEvent.keyPress(basenameInput, { key: 'Enter', code: 'Enter', charCode: 13 });
      expect(mockHandleFilenameChange).toHaveBeenCalledWith('anotherName.s2p');
    });

    it('does not call handleFilenameChange if basename is unchanged on blur', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile');
      fireEvent.blur(basenameInput); // Blur without changing
      expect(mockHandleFilenameChange).not.toHaveBeenCalled();
    });

    it('reverts to original basename if input is cleared and blurred', () => {
      renderComponent();
      const basenameInput = screen.getByDisplayValue('testfile') as HTMLInputElement;
      fireEvent.change(basenameInput, { target: { value: '' } });
      fireEvent.blur(basenameInput);
      expect(mockHandleFilenameChange).not.toHaveBeenCalled(); // Should not call if effectively no change or invalid
      expect(basenameInput.value).toBe('testfile'); // Reverted
    });

    it('updates displayed basename when filename prop changes externally', () => {
      const { rerender } = renderComponent('first.s1p');
      let basenameInput = screen.getByDisplayValue('first') as HTMLInputElement;
      expect(basenameInput).toBeInTheDocument();
      expect(screen.getByText('.s1p')).toBeInTheDocument();

      rerender(
        <FileInfo
          touchstone={mockTouchstoneInstance}
          unit="GHz"
          handleUnitChange={mockHandleUnitChange}
          format="RI"
          handleFormatChange={mockHandleFormatChange}
          filename="secondName.s4p" // New filename prop
          handleFilenameChange={mockHandleFilenameChange}
          comments={initialComments}
          handleCommentsChange={mockHandleCommentsChange}
        />
      );
      basenameInput = screen.getByDisplayValue('secondName') as HTMLInputElement;
      expect(basenameInput).toBeInTheDocument();
      expect(screen.getByText('.s4p')).toBeInTheDocument();
    });
  });

  // Placeholder for Comments Editing tests
  describe('Comments Editing', () => {
    it('displays initial comments in a textarea', () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText(/Enter comments here, one per line./i) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(initialComments.join('\n'));
    });

    it('calls handleCommentsChange when textarea content is changed', () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText(/Enter comments here, one per line./i);
      fireEvent.change(textarea, { target: { value: "new comment 1\nnew comment 2" } });
      expect(mockHandleCommentsChange).toHaveBeenCalledWith(["new comment 1", "new comment 2"]);
    });

    it('updates textarea when comments prop changes externally', () => {
      const { rerender } = renderComponent(initialFilename, ['original line 1']);
      let textarea = screen.getByPlaceholderText(/Enter comments here, one per line./i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('original line 1');

      const newCommentsProp = ['updated line 1', 'updated line 2'];
      mockTouchstoneInstance.comments = [...newCommentsProp]; // Assuming touchstone comments also update

      rerender(
         <FileInfo
          touchstone={mockTouchstoneInstance}
          unit="GHz"
          handleUnitChange={mockHandleUnitChange}
          format="RI"
          handleFormatChange={mockHandleFormatChange}
          filename={initialFilename}
          handleFilenameChange={mockHandleFilenameChange}
          comments={newCommentsProp} // Pass new comments
          handleCommentsChange={mockHandleCommentsChange}
        />
      );
      textarea = screen.getByPlaceholderText(/Enter comments here, one per line./i) as HTMLTextAreaElement;
      expect(textarea.value).toBe(newCommentsProp.join('\n'));
    });
  });
});
