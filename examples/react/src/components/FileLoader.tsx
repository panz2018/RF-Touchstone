import React from 'react'

interface FileLoaderProps {
  uploadFile: (file: File) => void
}

const FileLoader: React.FC<FileLoaderProps> = ({ uploadFile }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset the input value to allow re-uploading the same file name
    if (event.target) {
      ;(event.target as HTMLInputElement).value = ''
    }
  }

  // Create a ref to the hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Function to trigger the hidden file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      {/* Button to trigger the file input */}
      <button className="prime-button" onClick={handleButtonClick}>Upload</button>
      {/* Hidden file input */}
      <input
        ref={fileInputRef} // Attach the ref
        type="file"
        accept=".s1p,.s2p,.s3p,.s4p,.s5p,.s6p,.s7p,.s8p,.s9p,.s10p,.s11p,.s12p,.s13p,.s14p,.s15p,.s16p,.s17p,.s18p,.s19p,.s20p"
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hide the input
      />
    </div>
  )
}

export default FileLoader
