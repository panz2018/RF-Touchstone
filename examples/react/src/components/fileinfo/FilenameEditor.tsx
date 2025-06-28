import React, { useState, useEffect } from 'react';

interface FilenameEditorProps {
  currentFilename: string;
  onFilenameChange: (newFilename: string) => void;
}

const FilenameEditor: React.FC<FilenameEditorProps> = ({ currentFilename, onFilenameChange }) => {
  const getBaseName = (name: string): string => name.substring(0, name.lastIndexOf('.')) || name;
  const getExtension = (name: string): string => name.substring(name.lastIndexOf('.'));

  const [editableBaseName, setEditableBaseName] = useState<string>(getBaseName(currentFilename));

  useEffect(() => {
    setEditableBaseName(getBaseName(currentFilename));
  }, [currentFilename]);

  const handleBaseNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableBaseName(event.target.value);
  };

  const handleBaseNameBlur = () => {
    const newFilename = editableBaseName.trim() + getExtension(currentFilename);
    if (editableBaseName.trim() === '') {
      // Revert if empty
      setEditableBaseName(getBaseName(currentFilename));
      return;
    }
    if (newFilename !== currentFilename) {
      onFilenameChange(newFilename);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleBaseNameBlur();
      (event.target as HTMLInputElement).blur();
    }
  };

  return (
    <p>
      <strong>Filename:</strong>{' '}
      <input
        type="text"
        value={editableBaseName}
        onChange={handleBaseNameChange}
        onBlur={handleBaseNameBlur}
        onKeyPress={handleKeyPress}
        style={{ marginLeft: '5px', padding: '2px' }}
        aria-label="Editable Filename Base"
      />
      <span>{getExtension(currentFilename)}</span>
    </p>
  );
};

export default FilenameEditor;
