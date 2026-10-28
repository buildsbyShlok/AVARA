import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export function StarRatingDisplay({ rating, size = 16, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating)
            ? 'fill-gold text-gold'
            : 'fill-sand-300 text-sand-400'
          }
        />
      ))}
    </div>
  );
}

export function StarRatingInput({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <motion.button
          key={star}
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-colors"
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= (hovered || value)
                ? 'fill-gold text-gold'
                : 'fill-sand-200 text-sand-400'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}
