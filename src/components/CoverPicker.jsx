export default function CoverPicker({ coverUrl, onChange }) {
  function openPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onChange(file);
      input.remove();
    };
    input.oncancel = () => input.remove();
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
