import React from 'react';

export default function ProgressBar({ value = 0, max = 100, showLabel = false, size = 'sm' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };

  return (
    <div className="w-full">
      <div className={`progress-track ${heights[size] || heights.sm}`}>
        <div
          className={`progress-fill ${pct >= 100 ? 'complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span>{value} / {max} lessons</span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}
