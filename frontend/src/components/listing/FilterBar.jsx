import { motion } from 'framer-motion';
import { Mountain, Building2, Castle, TreePine, Waves, Snowflake, Globe } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Destinations', icon: Globe },
  { key: 'beach', label: 'Beachfront', icon: Waves },
  { key: 'mountain', label: 'Mountains', icon: Mountain },
  { key: 'city', label: 'Urban Lofts', icon: Building2 },
  { key: 'historic', label: 'Historic Villas', icon: Castle },
  { key: 'nature', label: 'Retreats', icon: TreePine },
  { key: 'arctic', label: 'Cold Havens', icon: Snowflake },
];

export default function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isActive = activeFilter === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onFilterChange(cat.key)}
            className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-colors select-none ${
              isActive ? 'text-white' : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-sand-200/70'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-obsidian rounded-full shadow-sm"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={15} />
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
