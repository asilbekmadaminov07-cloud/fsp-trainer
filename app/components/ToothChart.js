'use client';

// FDI tish raqamlash tizimi bo'yicha interaktiv tish sxemasi.
// Bosilgan tish raqami diagnoz maydoniga "Zahn NN" sifatida qo'shiladi.
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function ToothChart({ selected, onSelect }) {
  function row(nums, cls) {
    return (
      <div className={'tooth-row ' + cls}>
        {nums.map(n => (
          <button
            type="button"
            key={n}
            className={'tooth-btn' + (selected === n ? ' active' : '')}
            onClick={() => onSelect(n)}
            title={`Zahn ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="tooth-chart">
      {row(UPPER, 'upper')}
      <div className="tooth-mid" />
      {row(LOWER, 'lower')}
    </div>
  );
}
