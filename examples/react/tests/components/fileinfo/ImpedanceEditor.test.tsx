import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImpedanceEditor from '../../../src/components/fileinfo/ImpedanceEditor';
import { TouchstoneImpedance } from 'rf-touchstone';

describe('ImpedanceEditor Component', () => {
  let mockOnImpedanceChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnImpedanceChange = vi.fn();
  });

  const renderEditor = (currentImpedance?: TouchstoneImpedance) => {
    render(
      <ImpedanceEditor
        currentImpedance={currentImpedance}
        onImpedanceChange={mockOnImpedanceChange}
      />
    );
  };

  it('renders with initial numeric impedance', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    expect(input.value).toBe('50');
  });

  it('renders with initial array impedance as comma-separated string', () => {
    renderEditor([50, 75, 100]);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    expect(input.value).toBe('50, 75, 100');
  });

  it('renders empty string if impedance is undefined', () => {
    renderEditor(undefined);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('updates local string state on input change', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '75, 100' } });
    expect(input.value).toBe('75, 100');
  });

  it('calls onImpedanceChange with a number on blur if valid single number input', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance');
    fireEvent.change(input, { target: { value: '75' } });
    fireEvent.blur(input);
    expect(mockOnImpedanceChange).toHaveBeenCalledWith(75);
  });

  it('calls onImpedanceChange with a number array on blur if valid comma-separated input', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance');
    fireEvent.change(input, { target: { value: '75, 100, 25' } });
    fireEvent.blur(input);
    expect(mockOnImpedanceChange).toHaveBeenCalledWith([75, 100, 25]);
  });

  it('calls onImpedanceChange on Enter key press', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance');
    fireEvent.change(input, { target: { value: '60' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnImpedanceChange).toHaveBeenCalledWith(60);
  });

  it('shows alert and reverts if input is empty on blur', async () => {
    window.alert = vi.fn(); // Mock window.alert
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  ' } }); // Whitespace only
    fireEvent.blur(input);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Impedance cannot be empty."));
    expect(input.value).toBe('50'); // Reverted
    expect(mockOnImpedanceChange).not.toHaveBeenCalled();
  });

  it('shows alert and reverts if input is non-numeric on blur', async () => {
    window.alert = vi.fn();
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Invalid impedance: All values must be numbers."));
    expect(input.value).toBe('50'); // Reverted
    expect(mockOnImpedanceChange).not.toHaveBeenCalled();
  });

  it('shows alert and reverts if comma-separated input contains non-numeric on blur', async () => {
    window.alert = vi.fn();
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '50, abc, 75' } });
    fireEvent.blur(input);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Invalid impedance: All values must be numbers."));
    expect(input.value).toBe('50'); // Reverted
    expect(mockOnImpedanceChange).not.toHaveBeenCalled();
  });

  it('does not call onImpedanceChange if value is parsed but effectively unchanged', () => {
    renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance');
    fireEvent.change(input, { target: { value: '50  ' } }); // Same value with whitespace
    fireEvent.blur(input);
    expect(mockOnImpedanceChange).not.toHaveBeenCalled();
  });

  it('updates input value when currentImpedance prop changes', () => {
    const { rerender } = renderEditor(50);
    const input = screen.getByLabelText('Editable Impedance') as HTMLInputElement;
    expect(input.value).toBe('50');

    rerender(
      <ImpedanceEditor
        currentImpedance={[75, 100]}
        onImpedanceChange={mockOnImpedanceChange}
      />
    );
    expect(input.value).toBe('75, 100');
  });
});
