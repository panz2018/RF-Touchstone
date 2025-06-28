import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import FrequencyUnitEditor from '../../../src/components/fileinfo/FrequencyUnitEditor';
import { FrequencyUnits, type FrequencyUnit } from 'rf-touchstone';

describe('FrequencyUnitEditor Component', () => {
  it('renders with initial unit and calls onUnitChange', () => {
    const mockOnUnitChange = vi.fn();
    render(
      <FrequencyUnitEditor
        currentUnit="GHz"
        onUnitChange={mockOnUnitChange}
        disabled={false}
      />
    );
    const select = screen.getByLabelText('Frequency Unit Selector') as HTMLSelectElement;
    expect(select.value).toBe('GHz');

    fireEvent.change(select, { target: { value: 'MHz' } });
    expect(mockOnUnitChange).toHaveBeenCalledWith('MHz');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <FrequencyUnitEditor
        currentUnit="GHz"
        onUnitChange={vi.fn()}
        disabled={true}
      />
    );
    const select = screen.getByLabelText('Frequency Unit Selector') as HTMLSelectElement;
    expect(select).toBeDisabled();
  });
});
