import React, { useState } from 'react';

interface UrlLoaderProps {
  onUrlSubmit: (url: string) => void;
  // Optional: A callback to inform the parent about an error during the fetch attempt within UrlLoader
  // This is if we decide to put the initial fetch validation (e.g., URL format) here.
  // onError?: (errorMessage: string) => void;
}

const UrlLoader: React.FC<UrlLoaderProps> = ({ onUrlSubmit }) => {
  const [url, setUrl] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleInput = () => {
    setShowInput(!showInput);
    setError(null); // Clear error when toggling
    if (showInput) { // If we are hiding the input, also clear the url
      setUrl('');
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('URL cannot be empty.');
      return;
    }
    // Basic URL validation (can be improved)
    try {
      new URL(url); // Check if the URL is valid
    } catch (_) {
      setError('Invalid URL format.');
      return;
    }
    setError(null); // Clear error before submitting
    onUrlSubmit(url);
    // Optionally, clear URL and hide input after successful submission attempt
    // setUrl('');
    // setShowInput(false);
  };

  return (
    <div>
      <button onClick={handleToggleInput}>
        {showInput ? 'Cancel URL Load' : 'Open from URL'}
      </button>
      {showInput && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null); // Clear error on new input
            }}
            placeholder="Enter Touchstone file URL"
            style={{ marginRight: '10px', padding: '5px', width: '300px' }}
          />
          <button onClick={handleSubmit} style={{ padding: '5px 10px' }}>
            Load URL
          </button>
        </div>
      )}
      {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}
    </div>
  );
};

export default UrlLoader;
