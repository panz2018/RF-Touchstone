import React, { useState, useEffect } from 'react';
import { Touchstone } from 'rf-touchstone';

const TouchstoneViewer: React.FC = () => {
  const [touchstoneData, setTouchstoneData] = useState<Touchstone | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('sample.s2p'); // Default sample file

  const loadFileContent = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const textContent = await response.text();
      const ts = Touchstone.fromString(textContent);
      setTouchstoneData(ts);
      setError(null);
    } catch (err) {
      console.error('Error loading or parsing Touchstone file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setTouchstoneData(null);
    }
  };

  useEffect(() => {
    // Load the default sample file on component mount
    loadFileContent(`/public/${fileName}`);
  }, [fileName]); // Reload if fileName changes (e.g., if we implement file switching)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name); // Keep track of the name for display or other purposes
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const textContent = e.target?.result as string;
          if (textContent) {
            const ts = Touchstone.fromString(textContent);
            setTouchstoneData(ts);
            setError(null);
          } else {
            throw new Error('File content is empty.');
          }
        } catch (err) {
          console.error('Error parsing uploaded Touchstone file:', err);
          setError(err instanceof Error ? err.message : 'Failed to parse uploaded file.');
          setTouchstoneData(null);
        }
      };
      reader.onerror = () => {
        setError('Error reading file.');
        setTouchstoneData(null);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h2>Touchstone File Viewer</h2>
      <div>
        <label htmlFor="fileInput">Upload a Touchstone file (.sNp): </label>
        <input type="file" id="fileInput" accept=".s1p,.s2p,.s3p,.sNp" onChange={handleFileChange} />
      </div>
      <p>Currently displaying: {touchstoneData ? `Data from ${fileName}` : (error ? `Error with ${fileName}`: `Loading ${fileName}...`)}</p>

      {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}

      {touchstoneData && (
        <div>
          <h3>File Information</h3>
          <p><strong>Type:</strong> {touchstoneData.type}</p>
          <p><strong>Frequency Unit:</strong> {touchstoneData.frequencyUnit}</p>
          <p><strong>Parameter:</strong> {touchstoneData.parameter}</p>
          <p><strong>Format:</strong> {touchstoneData.format}</p>
          <p><strong>Resistance:</strong> {touchstoneData.resistance} Ohms</p>
          {touchstoneData.comments.length > 0 && (
            <div>
              <strong>Comments:</strong>
              <ul>
                {touchstoneData.comments.map((comment, index) => (
                  <li key={index}>{comment}</li>
                ))}
              </ul>
            </div>
          )}

          <h3>Network Data</h3>
          {touchstoneData.networkData && touchstoneData.networkData.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Frequency ({touchstoneData.frequencyUnit})</th>
                  {/* Assuming S-parameters; adjust if other parameters */}
                  {Array.from({ length: touchstoneData.ports }, (_, i) =>
                    Array.from({ length: touchstoneData.ports }, (_, j) => (
                      <React.Fragment key={`s${i+1}${j+1}`}>
                        <th>S{i+1}{j+1} (Magnitude)</th>
                        <th>S{i+1}{j+1} (Angle)</th>
                      </React.Fragment>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {touchstoneData.networkData.map((dataPoint, index) => (
                  <tr key={index}>
                    <td>{dataPoint.frequency}</td>
                    {dataPoint.parameters.map((paramRow, i) =>
                      paramRow.map((param, j) => (
                        <React.Fragment key={`param-${i}-${j}`}>
                          <td>{param.magnitude?.toFixed(4) ?? 'N/A'}</td>
                          <td>{param.angle?.toFixed(4) ?? 'N/A'}</td>
                        </React.Fragment>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No network data available.</p>}
        </div>
      )}
    </div>
  );
};

export default TouchstoneViewer;
