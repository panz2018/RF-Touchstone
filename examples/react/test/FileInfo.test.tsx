import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FileInfo from '../src/components/FileInfo' // Adjusted path
import FilenameEditor from '../src/components/fileinfo/FilenameEditor'
import CommentsEditor from '../src/components/fileinfo/CommentsEditor'
import ImpedanceEditor from '../src/components/fileinfo/ImpedanceEditor'
import FrequencyUnitEditor from '../src/components/fileinfo/FrequencyUnitEditor'
import DataFormatEditor from '../src/components/fileinfo/DataFormatEditor'
import {
  Touchstone,
  Frequency,
  TouchstoneImpedance,
  FrequencyUnit,
  TouchstoneFormat,
} from 'rf-touchstone'

// Mock the sub-components
vi.mock('../src/components/fileinfo/FilenameEditor', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-filename-editor">
      Filename: {props.currentFilename}
    </div>
  )),
}))
vi.mock('../src/components/fileinfo/CommentsEditor', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-comments-editor">
      Comments: {props.currentComments.join('/')}
    </div>
  )),
}))
vi.mock('../src/components/fileinfo/ImpedanceEditor', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-impedance-editor">
      Impedance:{' '}
      {Array.isArray(props.currentImpedance)
        ? props.currentImpedance.join(',')
        : props.currentImpedance}
    </div>
  )),
}))
vi.mock('../src/components/fileinfo/FrequencyUnitEditor', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-frequency-unit-editor">
      Unit: {props.currentUnit}
    </div>
  )),
}))
vi.mock('../src/components/fileinfo/DataFormatEditor', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-data-format-editor">
      Format: {props.currentFormat}
    </div>
  )),
}))

describe('FileInfo Main Container Component', () => {
  let mockTouchstone: Touchstone
  let mockSetFilename: ReturnType<typeof vi.fn>
  let mockSetComments: ReturnType<typeof vi.fn>
  let mockSetImpedance: ReturnType<typeof vi.fn>
  let mockSetUnit: ReturnType<typeof vi.fn>
  let mockSetFormat: ReturnType<typeof vi.fn>

  const initialFilename = 'testfile.s2p'

  beforeEach(() => {
    vi.clearAllMocks()

    mockTouchstone = new Touchstone()
    mockTouchstone.frequency = new Frequency() // Initialize frequency object
    mockTouchstone.frequency.unit = 'GHz'
    mockTouchstone.frequency.f_scaled = [1, 2]
    mockTouchstone.format = 'RI'
    mockTouchstone.comments = ['Initial Comment']
    mockTouchstone.impedance = 50
    mockTouchstone.nports = 2
    mockTouchstone.parameter = 'S'

    mockSetFilename = vi.fn()
    mockSetComments = vi.fn()
    mockSetImpedance = vi.fn()
    mockSetUnit = vi.fn()
    mockSetFormat = vi.fn()
  })

  const renderFileInfoContainer = (
    touchstoneInstance: Touchstone | null = mockTouchstone
  ) => {
    render(
      <FileInfo
        touchstone={touchstoneInstance}
        filename={initialFilename}
        setFilename={mockSetFilename}
        setComments={mockSetComments}
        setImpedance={mockSetImpedance}
        setUnit={mockSetUnit}
        setFormat={mockSetFormat}
      />
    )
  }

  it('renders \"No Touchstone data loaded.\" when touchstone prop is null', () => {
    renderFileInfoContainer(null)
    expect(screen.getByText('No Touchstone data loaded.')).toBeInTheDocument()
  })

  it('renders all sub-editor components when touchstone data is present', () => {
    renderFileInfoContainer()
    expect(screen.getByTestId('mock-filename-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-comments-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-impedance-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-frequency-unit-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-data-format-editor')).toBeInTheDocument()
    expect(
      screen.getByText(`Port number: ${mockTouchstone.nports}`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(`Parameter: ${mockTouchstone.parameter}`)
    ).toBeInTheDocument()
  })

  it('passes correct props to FilenameEditor', () => {
    renderFileInfoContainer()
    const FilenameEditorMock = vi.mocked(FilenameEditor)
    expect(FilenameEditorMock).toHaveBeenCalledTimes(1)
    const props = FilenameEditorMock.mock.calls[0][0]
    expect(props.currentFilename).toBe(initialFilename)
    expect(props.onFilenameChange).toBe(mockSetFilename)
  })

  it('passes correct props to CommentsEditor', () => {
    renderFileInfoContainer()
    const CommentsEditorMock = vi.mocked(CommentsEditor)
    expect(CommentsEditorMock).toHaveBeenCalledTimes(1)
    const props = CommentsEditorMock.mock.calls[0][0]
    expect(props.currentComments).toEqual(mockTouchstone.comments)
    expect(props.onCommentsChange).toBe(mockSetComments)
  })

  it('passes correct props to ImpedanceEditor', () => {
    renderFileInfoContainer()
    const ImpedanceEditorMock = vi.mocked(ImpedanceEditor)
    expect(ImpedanceEditorMock).toHaveBeenCalledTimes(1)
    const props = ImpedanceEditorMock.mock.calls[0][0]
    expect(props.currentImpedance).toEqual(mockTouchstone.impedance)
    expect(props.onImpedanceChange).toBe(mockSetImpedance)
  })

  it('passes correct props to FrequencyUnitEditor', () => {
    renderFileInfoContainer()
    const FrequencyUnitEditorMock = vi.mocked(FrequencyUnitEditor)
    expect(FrequencyUnitEditorMock).toHaveBeenCalledTimes(1)
    const props = FrequencyUnitEditorMock.mock.calls[0][0]
    expect(props.currentUnit).toBe(mockTouchstone.frequency?.unit)
    expect(props.onUnitChange).toBe(mockSetUnit)
    expect(props.disabled).toBe(!mockTouchstone.frequency)
  })

  it('passes correct props to DataFormatEditor', () => {
    renderFileInfoContainer()
    const DataFormatEditorMock = vi.mocked(DataFormatEditor)
    expect(DataFormatEditorMock).toHaveBeenCalledTimes(1)
    const props = DataFormatEditorMock.mock.calls[0][0]
    expect(props.currentFormat).toBe(mockTouchstone.format)
    expect(props.onFormatChange).toBe(mockSetFormat)
    expect(props.disabled).toBe(!mockTouchstone.format)
  })
})
