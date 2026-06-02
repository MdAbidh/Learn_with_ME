import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 16 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-colors duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              size={size}
              className={filled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
            />
          </button>
        );
      })}
    </div>
  );
}
