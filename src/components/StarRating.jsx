export default function StarRating({ value = 0, onChange, readonly = false }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => !readonly && onChange?.(star === value ? 0 : star)}
          disabled={readonly}
          aria-label={`${star} star`}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
