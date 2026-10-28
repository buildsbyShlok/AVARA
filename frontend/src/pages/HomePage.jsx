import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Compass, Sparkles, MapPin } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import ListingCard from '../components/listing/ListingCard';
import FilterBar from '../components/listing/FilterBar';
import Skeleton from '../components/ui/Skeleton';
import listingService from '../services/listingService';
import { fadeUp, staggerContainer } from '../animations/variants';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError('');
        const data = await listingService.getAll();
        setListings(data.listings || []);
      } catch (err) {
        setError(err.message || 'Destinations could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [retry]);

  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchSearch =
        !searchQuery.trim() ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'beach') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('beach') || text.includes('ocean') || text.includes('sea') || text.includes('coastal') || text.includes('island');
      }
      if (activeFilter === 'mountain') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('mountain') || text.includes('cabin') || text.includes('alps') || text.includes('hill') || text.includes('snow');
      }
      if (activeFilter === 'city') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('loft') || text.includes('city') || text.includes('urban') || text.includes('apartment') || text.includes('downtown');
      }
      if (activeFilter === 'historic') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('villa') || text.includes('historic') || text.includes('castle') || text.includes('estate') || text.includes('chateau');
      }
      if (activeFilter === 'nature') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('treehouse') || text.includes('retreat') || text.includes('nature') || text.includes('lake') || text.includes('forest');
      }
      if (activeFilter === 'arctic') {
        const text = (item.title + ' ' + item.description + ' ' + item.location).toLowerCase();
        return text.includes('winter') || text.includes('arctic') || text.includes('nordic') || text.includes('cold') || text.includes('aspen');
      }
      return true;
    });
  }, [listings, searchQuery, activeFilter]);

  return (
    <PageTransition className="flex-1 pb-24">
      {/* Editorial Hero Experience */}
      <section className="relative overflow-hidden bg-sand-100/70 border-b border-obsidian-100/60 pt-12 md:pt-20 pb-16 md:pb-24">
        {/* Subtle Atmospheric Topography Background */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#0B0F15_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            {/* AVARA Tagline Pill */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-avara-50 border border-avara-200/80 text-avara-600 text-xs md:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles size={14} className="text-avara-500" />
              <span>AVARA &bull; Cinematic Travel Operating System</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold text-obsidian tracking-tight leading-[1.06] mb-6"
            >
              Go somewhere worth <span className="italic text-avara-500 font-normal">remembering</span>.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-obsidian-600 max-w-2xl mx-auto font-normal leading-relaxed mb-10"
            >
              Architectural residences, remote coastal pavilions, and alpine havens curated for travelers who value design and spatial purity.
            </motion.p>

            {/* Live Search Discovery Input */}
            <motion.div
              variants={fadeUp}
              className="relative max-w-2xl mx-auto"
            >
              <div className="relative flex items-center bg-white rounded-full p-2 shadow-card hover:shadow-float border border-obsidian-100/80 transition-all duration-300">
                <div className="pl-4 text-avara-500">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by destination, country, or atmosphere (e.g. Malibu, Italy, Cabin)..."
                  className="w-full px-4 py-2.5 bg-transparent text-sm md:text-base text-obsidian placeholder-obsidian-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-3 px-2 py-1 text-xs font-semibold text-obsidian-400 hover:text-obsidian-700 bg-sand-200 rounded-full transition-colors"
                  >
                    Clear
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-obsidian text-white rounded-full text-xs font-semibold shrink-0 uppercase tracking-wider">
                  <Compass size={13} className="text-gold-300" />
                  <span>{filteredListings.length} Places</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Discovery Feed Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        {/* Category Filter Bar */}
        <div className="mb-10">
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Listings Display: Asymmetric Editorial Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="space-y-4">
                <Skeleton className="h-[360px] w-full !rounded-3xl" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-16 bg-white rounded-4xl border border-obsidian-100 p-8">
            <h3 className="font-serif text-2xl font-bold mb-3">Destinations are temporarily unavailable</h3>
            <p className="text-sm text-obsidian-600 mb-6">{error}</p>
            <button onClick={() => setRetry(value => value + 1)} className="px-6 py-3 bg-obsidian text-white rounded-full">Try again</button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-4xl border border-obsidian-100/60 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-sand-200 mx-auto flex items-center justify-center text-obsidian-400 mb-4">
              <MapPin size={28} />
            </div>
            <h3 className="font-serif font-bold text-2xl text-obsidian mb-2">No Sanctuaries Found</h3>
            <p className="text-sm text-obsidian-500 max-w-md mx-auto mb-6">
              We couldn't find any destinations matching &ldquo;{searchQuery}&rdquo;. Try another term, or reset your filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              className="px-6 py-2.5 bg-obsidian text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-obsidian-900 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-[auto]">
            {filteredListings.map((listing, index) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
