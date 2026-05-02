import { useState, useRef } from 'react';

export default function CoverPicker({ coverUrl, onChange }) {
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) onChange(file);
    e.target.value = '';
    setShowInput(false);
  }

  function handleClick() {
    setShowInput(true);
    setTimeout(() => inputRef.current?.click(), 0);
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      <button type="button" className="cover-label" onClick={handleClick}>
        Add Cover Photo
      </button>
      {showInput && (
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/heic"
          onChange={handleFile}
          onBlur={() => setShowInput(false)}
          className="cover-input-hidden"
        />
      )}
    </div>
  );
}
