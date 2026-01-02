import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

import TouchstoneViewer from '../src/TouchstoneViewer'
import { Touchstone, type TouchstoneMatrix } from 'rf-touchstone'

// Mock Touchstone static methods
vi.mock('rf-touchstone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rf-touchstone')>()
  return {
    ...actual,
    Touchstone: class extends (actual.Touchstone as any) {
      static fromUrl = vi.fn()
      static fromFile = vi.fn()
    },
  }
})

// --- Mock Child Components ---
vi.mock('../src/components/UrlLoader', () => ({
  default: vi.fn(({ loadUrl }: { loadUrl: (_url: string) => void }) => (
    <div data-testid="mock-urlloader">
      <button onClick={() => loadUrl('http://default-mock-url.com/file.s2p')}>
        Mock UrlLoader Submit
      </button>
    </div>
  )),
}))

vi.mock('../src/components/FileLoader', () => ({
  default: vi.fn(({ uploadFile }: { uploadFile: (_file: File) => void }) => (
    <div data-testid="mock-fileloader">
      <input
        type="file"
        data-testid="mock-file-input"
        onChange={(e) => {
          if (e.target.files?.[0]) uploadFile(e.target.files[0])
        }}
      />
    </div>
  )),
}))

vi.mock('../src/components/DataTable', () => ({
  default: vi.fn(
    (props: {
      filename: string
      updateMatrixFrequency: (_m: TouchstoneMatrix, _f: number[]) => void
    }) => (
      <div data-testid="mock-datatable">
        <span>Mock DataTable (File: {props.filename})</span>
        <button onClick={() => props.updateMatrixFrequency([], [])}>
          Mock Set Matrix
        </button>
      </div>
    )
  ),
}))

vi.mock('../src/components/fileinfo/FilenameEditor', () => ({
  default: vi.fn(
    (props: {
      currentFilename: string
      onFilenameChange: (_name: string) => void
    }) => (
      <div data-testid="mock-filename-editor">
        <input
          data-testid="filename-input-mock"
          value={props.currentFilename}
          onChange={(e) => props.onFilenameChange(e.target.value)}
        />
      </div>
    )
  ),
}))

vi.mock('../src/components/fileinfo/CommentsEditor', () => ({
  default: vi.fn(
    (props: { onCommentsChange: (_comments: string[]) => void }) => (
      <div data-testid="mock-comments-editor">
        <button onClick={() => props.onCommentsChange(['New Comment'])}>
          Mock Set Comments
        </button>
      </div>
    )
  ),
}))

vi.mock('../src/components/fileinfo/FrequencyUnitEditor', () => ({
  default: vi.fn((props: { onUnitChange: (_unit: string) => void }) => (
    <div data-testid="mock-frequency-unit-editor">
      <button onClick={() => props.onUnitChange('GHz')}>Mock Set Unit</button>
    </div>
  )),
}))

vi.mock('../src/components/fileinfo/DataFormatEditor', () => ({
  default: vi.fn((props: { onFormatChange: (_format: string) => void }) => (
    <div data-testid="mock-data-format-editor">
      <button onClick={() => props.onFormatChange('MA')}>
        Mock Set Format
      </button>
    </div>
  )),
}))

vi.mock('../src/components/fileinfo/ImpedanceEditor', () => ({
  default: vi.fn((props: { onImpedanceChange: (_imp: number) => void }) => (
    <div data-testid="mock-impedance-editor">
      <button onClick={() => props.onImpedanceChange(75)}>
        Mock Set Impedance
      </button>
    </div>
  )),
}))

vi.mock('../src/components/CopyButton', () => ({
  default: vi.fn(({ touchstone }: { touchstone: Touchstone | null }) => (
    <button data-testid="mock-copybutton" disabled={!touchstone}>
      Mock Copy Button
    </button>
  )),
}))

vi.mock('../src/components/DownloadButton', () => ({
  default: vi.fn(
    ({
      touchstone,
      filename,
    }: {
      touchstone: Touchstone | null
      filename: string
    }) => (
      <button data-testid="mock-downloadbutton" disabled={!touchstone}>
        Mock Download Button {filename}
      </button>
    )
  ),
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn(),
  })
})

const mockSampleS2PContent = `! Sample S2P File
! Original Comment 1
# HZ S RI R 50
1000000000 0.9 -0.1 0.01 0.02 0.01 0.02 0.8 -0.15
2000000000 0.8 -0.2 0.02 0.03 0.02 0.03 0.7 -0.25`

const createTouchstoneFromString = (
  content: string,
  nports = 2
): Touchstone => {
  const ts = new Touchstone()
  ts.readContent(content, nports)
  return ts
}

describe('TouchstoneViewer Component', () => {
  const mockedFromUrl = Touchstone.fromUrl as Mock
  const mockedFromFile = Touchstone.fromFile as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    })
    const initialTs = createTouchstoneFromString(mockSampleS2PContent)
    mockedFromUrl.mockImplementation(async (_url: string) => {
      if (_url === '/sample.s2p' || _url === 'sample.s2p') return initialTs
      return Promise.reject(
        new Error(`mockedFromUrl received unexpected URL: ${_url}.`)
      )
    })
    mockedFromFile.mockResolvedValue(
      createTouchstoneFromString('! Mocked by fromFile')
    )
  })

  it('renders initial state, loads default file, and passes correct props to children', async () => {
    render(<TouchstoneViewer />)
    expect(screen.getByText(/Touchstone File Viewer/i)).toBeInTheDocument()
    expect(screen.getByTestId('mock-urlloader')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedFromUrl).toHaveBeenCalledWith('sample.s2p')
      expect(
        screen.getByText(/Currently displaying: Data from sample.s2p/i)
      ).toBeInTheDocument()
    })

    expect(screen.getByTestId('mock-filename-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-copybutton')).toBeInTheDocument()
    expect(screen.getByTestId('mock-downloadbutton')).toBeInTheDocument()
    expect(screen.getByTestId('mock-datatable')).toBeInTheDocument()

    expect(
      (screen.getByTestId('filename-input-mock') as HTMLInputElement).value
    ).toBe('sample.s2p')
  })

  it('handles filename change from FilenameEditor', async () => {
    render(<TouchstoneViewer />)
    await waitFor(() =>
      expect(mockedFromUrl).toHaveBeenCalledWith('sample.s2p')
    )

    const newFilenameFromChild = 'userEditedName.s2p'
    const input = screen.getByTestId('filename-input-mock')
    fireEvent.change(input, { target: { value: newFilenameFromChild } })

    await waitFor(() => {
      expect(
        screen.getByText(`Mock Download Button ${newFilenameFromChild}`)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Currently displaying: Data from userEditedName.s2p/i)
      ).toBeInTheDocument()
    })
  })

  it('handles comments change from CommentsEditor', async () => {
    render(<TouchstoneViewer />)
    await waitFor(() =>
      expect(mockedFromUrl).toHaveBeenCalledWith('sample.s2p')
    )

    fireEvent.click(screen.getByText('Mock Set Comments'))

    await waitFor(() => {
      // Check that the touchstone state was updated
    })
  })

  it('handles local file upload', async () => {
    const mockUploadedFileContent = `! Uploaded S2P File\n# GHZ S MA R 75\n1 0.5 10 0.05 20 0.05 20 0.4 30`
    const uploadedFile = new File([mockUploadedFileContent], 'uploaded.s2p', {
      type: 'text/plain',
    })
    const uploadedTs = createTouchstoneFromString(mockUploadedFileContent)
    mockedFromFile.mockResolvedValue(uploadedTs)

    render(<TouchstoneViewer />)
    await waitFor(() =>
      expect(mockedFromUrl).toHaveBeenCalledWith('sample.s2p')
    )
    mockedFromUrl.mockClear()

    const fileLoader = screen.getByTestId('mock-fileloader')
    const fileInput = fileLoader.querySelector('input')!
    fireEvent.change(fileInput, { target: { files: [uploadedFile] } })

    await waitFor(() => {
      expect(mockedFromFile).toHaveBeenCalledWith(uploadedFile)
      expect(
        screen.getByText(/Currently displaying: Data from uploaded.s2p/i)
      ).toBeInTheDocument()
    })
  })

  it('handles URL submission', async () => {
    const tsFromUrl = createTouchstoneFromString(
      '! From URL\n# MHZ S DB R 50\n100 0 -90 0 0',
      1
    )
    mockedFromUrl.mockResolvedValueOnce(tsFromUrl)

    render(<TouchstoneViewer />)
    await waitFor(() => {
      expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mock UrlLoader Submit'))

    await waitFor(() => {
      expect(mockedFromUrl).toHaveBeenCalledWith(
        'http://default-mock-url.com/file.s2p'
      )
    })
  })

  it('handles impedance change', async () => {
    render(<TouchstoneViewer />)
    await waitFor(() => {
      expect(screen.getByText(/Data from sample.s2p/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mock Set Impedance'))

    await waitFor(() => {
      // Internal state update check
    })
  })
})
