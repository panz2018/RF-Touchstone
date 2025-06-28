import React from 'react';

interface CommentsEditorProps {
  currentComments: string[];
  onCommentsChange: (newComments: string[]) => void;
}

const CommentsEditor: React.FC<CommentsEditorProps> = ({ currentComments, onCommentsChange }) => {
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCommentsChange(event.target.value.split('\n'));
  };

  return (
    <div>
      <strong>Comments:</strong>
      <textarea
        value={currentComments.join('\n')}
        onChange={handleTextChange}
        rows={Math.max(3, currentComments.length)}
        style={{ width: '100%', marginTop: '5px', padding: '5px', boxSizing: 'border-box' }}
        placeholder="Enter comments here, one per line."
        aria-label="Editable Comments"
      />
    </div>
  );
};

export default CommentsEditor;
