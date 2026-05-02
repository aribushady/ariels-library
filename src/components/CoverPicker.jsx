import { useRef } from 'react';

export default function CoverPicker({ coverUrl, onChange }) {
  const cameraRef = useRef();
  const libraryRef = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      <div className="cover-buttons">
        <button type="button" onClick={() => cameraRef.current?.click()}>
          📷 Take Photo
        </button>
        <button type="button" onClick={() => libraryRef.current?.click()}>
          🖼️ Choose Photo
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}
