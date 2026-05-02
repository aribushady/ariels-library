import { useRef } from 'react';

export default function CoverPicker({ coverUrl, onChange }) {
  const inputRef = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
    e.target.value = '';
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      <div className="cover-buttons">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Add Cover Photo
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}
