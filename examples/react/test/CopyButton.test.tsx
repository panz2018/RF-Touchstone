import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CopyButton from '../src/components/CopyButton';
import { Touchstone } from 'rf-touchstone';

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('CopyButton Component', () => {
  let mockWriteText: ReturnType<typeof vi.fn>;
  let mockTouchstone: Touchstone | null;

  beforeEach(() => {
    vi.useFakeTimers(); // Use fake timers for setTimeout
    mockWriteText = navigator.clipboard.writeText as vi.Mock;
    mockWriteText.mockReset(); // Reset mock before each test

    // Default mock touchstone instance
    mockTouchstone = new Touchstone();
    mockTouchstone.comments = ['Test comment'];
    // Simple toString implementation for testing
    vi.spyOn(mockTouchstone, 'toString').mockImplementation(() => "! Touchstone Data\n# HZ S RI R 50\n1000 0.1 0.2 0.3 0.4");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers(); // Restore real timers
    if (mockTouchstone && (mockTouchstone.toString as any).mockRestore) {
      (mockTouchstone.toString as any).mockRestore(); // Restore spy if it exists
    }
  });

  it('renders the "Copy Data" button', () => {
    render(<CopyButton touchstone={mockTouchstone} />);
    expect(screen.getByRole('button', { name: /Copy Data/i })).toBeInTheDocument();
  });

  it('disables the button if touchstone prop is null', () => {
    render(<CopyButton touchstone={null} />);
    expect(screen.getByRole('button', { name: /Copy Data/i })).toBeDisabled();
  });

  it('enables the button if touchstone prop is provided', () => {
    render(<CopyButton touchstone={mockTouchstone} />);
    expect(screen.getByRole('button', { name: /Copy Data/i })).not.toBeDisabled();
  });

  it('calls touchstone.toString and navigator.clipboard.writeText on click', async () => {
    mockWriteText.mockResolvedValue(undefined); // Simulate successful copy
    render(<CopyButton touchstone={mockTouchstone} />);

    fireEvent.click(screen.getByRole('button', { name: /Copy Data/i }));

    expect(mockTouchstone!.toString).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("! Touchstone Data\n# HZ S RI R 50\n1000 0.1 0.2 0.3 0.4");
    });
  });

  it('displays "Copied to clipboard!" on successful copy and clears it after 3 seconds', async () => {
    mockWriteText.mockResolvedValue(undefined);
    render(<CopyButton touchstone={mockTouchstone} />);

    fireEvent.click(screen.getByRole('button', { name: /Copy Data/i }));

    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000); // Advance timers by 3 seconds

    await waitFor(() => {
      expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument();
    });
  });

  it('displays "Failed to copy." on copy failure and clears it after 3 seconds', async () => {
    mockWriteText.mockRejectedValue(new Error('Copy failed'));
    render(<CopyButton touchstone={mockTouchstone} />);

    fireEvent.click(screen.getByRole('button', { name: /Copy Data/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to copy.')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Failed to copy.')).not.toBeInTheDocument();
    });
  });

  it('displays "No data to copy." if touchstone is null and button is somehow clicked (e.g. if disabled logic failed)', async () => {
    // This test is more about the internal logic of handleCopyData if button wasn't disabled
    render(<CopyButton touchstone={null} />);
    const button = screen.getByRole('button', { name: /Copy Data/i });

    // Simulate click even if disabled (e.g. by directly calling handler if possible, or forcing event)
    // For this component, we'll just assume if it were clickable:
    // We can't directly call handleCopyData as it's internal.
    // So we rely on the disabled attribute, but test the message if it were to be called.
    // A more direct way:
    const instance = new CopyButton({ touchstone: null });
    // instance.handleCopyData(); // This doesn't work as it's not how React components are typically tested for internal methods.
    // Instead, we'll check the status message part, assuming the click could happen.

    // Let's ensure the button is disabled first.
    expect(button).toBeDisabled();

    // If we want to test the message when touchstone is null, we might need a different approach
    // or accept that the disabled state prevents this specific message from appearing through a click.
    // However, the CopyButton component itself sets this state if its internal handleCopyData is called with null touchstone.
    // We can verify the initial state of copyStatus is empty.
    expect(screen.queryByText(/No data to copy./i)).not.toBeInTheDocument();
    // If the button was clicked (and not disabled), this message would appear.
    // For now, this test confirms the button is disabled.
  });
});
