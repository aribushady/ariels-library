import { useState } from 'react';

export default function CoverPicker({ coverUrl, onChange }) {
  const [picking, setPicking] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) onChange(file);
    e.target.value = '';
    setPicking(false);
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      {picking ? (
        <label className="cover-label">
          Choose from Photos
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic"
            onChange={handleFile}
            className="cover-input-hidden"
          />
        </label>
      ) : (
        <button type="button" className="cover-label" onClick={() => setPicking(true)}>
          Add Cover Photo
        </button>
      )}
    </div>
  );
}
