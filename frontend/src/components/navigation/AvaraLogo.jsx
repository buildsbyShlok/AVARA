import { motion } from 'framer-motion';

export default function AvaraLogo({ size = 'md', className = '' }) {
  const isLarge = size === 'lg';

  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {/* Geometric AVARA Monogram Mark */}
      <motion.div
        whileHover={{ scale: 1.06, rotate: 3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        className="relative flex items-center justify-center shrink-0"
      >
        <svg
          width={isLarge ? "36" : "28"}
          height={isLarge ? "36" : "28"}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500"
        >
          {/* Outer Diamond/Prism Contour */}
          <rect
            x="20"
            y="2"
            width="25.45"
            height="25.45"
            rx="5"
            transform="rotate(45 20 2)"
            className="stroke-avara-500 group-hover:stroke-avara-600 transition-colors"
            strokeWidth="2.5"
          />
          {/* Inner Architectural 'A' Chevron */}
          <path
            d="M13 27L20 12L27 27"
            className="stroke-obsidian group-hover:stroke-avara-500 transition-colors"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Horizontal Golden Travel Horizon Bar */}
          <path
            d="M16 22H24"
            className="stroke-gold-400"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Central Zenith Dot */}
          <circle
            cx="20"
            cy="17"
            r="1.8"
            className="fill-avara-500"
          />
        </svg>
      </motion.div>

      {/* Editorial Wordmark */}
      <div className="flex flex-col">
        <span className={`font-serif tracking-[0.25em] font-extrabold text-obsidian uppercase transition-colors group-hover:text-avara-500 ${
          isLarge ? 'text-2xl' : 'text-xl'
        }`}>
          AVARA
        </span>
        <span className="text-[9px] tracking-[0.2em] font-semibold text-obsidian-400 uppercase -mt-0.5">
          Travel OS
        </span>
      </div>
    </div>
  );
}
