import { useRef } from 'react';

const STEPS = [0, 0.25, 0.5, 0.75, 1];

let counter = 0;

export default function StarRating({ value = 0, onChange, readonly = false }) {
  const idRef = useRef(`sr-${++counter}`);
  const prefix = idRef.current;

  function handleTap(starIndex) {
    if (readonly) return;
    const base = starIndex - 1;
    const currentFill = Math.max(0, Math.min(1, value - base));
    const currentStep = STEPS.reduce((closest, s) =>
      Math.abs(s - currentFill) < Math.abs(closest - currentFill) ? s : closest
    , 0);
    const nextIdx = (STEPS.indexOf(currentStep) + 1) % STEPS.length;
    const newValue = base + STEPS[nextIdx];
    onChange?.(newValue);
  }

  function renderStar(starIndex) {
    const fill = Math.max(0, Math.min(1, value - (starIndex - 1)));
    const clipId = `${prefix}-${starIndex}`;

    return (
      <button
        key={starIndex}
        type="button"
        className="star"
        onClick={() => handleTap(starIndex)}
        disabled={readonly}
        aria-label={`Star ${starIndex}`}
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={fill * 24} height="24" />
            </clipPath>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="star-outline"
          />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
            fill="currentColor"
            clipPath={`url(#${clipId})`}
            className="star-fill"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(renderStar)}
      {!readonly && <span className="star-value">{value.toFixed(2)}</span>}
    </div>
  );
}
