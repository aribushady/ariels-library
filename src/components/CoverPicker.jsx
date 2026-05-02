export default function CoverPicker({ coverUrl, onChange }) {
  function openPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onChange(file);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  }

  return (
    <div className="cover-picker">
      {coverUrl ? (
        <img src={coverUrl} alt="Book cover" className="cover-preview" />
      ) : (
        <div className="cover-placeholder">No Cover</div>
      )}
      <div className="cover-buttons">
        <button type="button" onClick={openPicker}>
          Add Cover Photo
        </button>
      </div>
    </div>
  );
}
