export default function CoverPicker({ coverUrl, onChange }) {
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) onChange(file);
    e.target.value = '';
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      <label className="cover-label">
        Add Cover Photo
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic"
          onChange={handleFile}
          className="cover-input-hidden"
        />
      </label>
    </div>
  );
}
