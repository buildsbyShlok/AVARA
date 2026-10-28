import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { fadeUp } from '../../animations/variants';

export default function ListingCard({ listing, index = 0, featured = false }) {
  const formattedPrice = new Intl.NumberFormat('en-IN').format(listing.price || 0);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={featured ? 'md:col-span-2 md:row-span-2' : ''}
    >
      <Link to={`/listings/${listing._id}`} className="group block h-full">
        <div className={`relative overflow-hidden rounded-3xl bg-sand-200 border border-obsidian-100/50 shadow-card hover:shadow-card-hover transition-shadow duration-500 flex flex-col justify-end ${
          featured ? 'h-[440px] md:h-full min-h-[420px]' : 'h-[360px]'
        }`}>
          {/* Journey Transition Shared Image */}
          <motion.img
            layoutId={`listing-image-${listing._id}`}
            src={listing.image?.url}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';
            }}
          />

          {/* Cinematic Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 opacity-70 group-hover:opacity-85 transition-opacity duration-500" />

          {/* Top Country Tag & Price Pill */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/15">
              {listing.country || 'Global'}
            </span>
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="text-sm font-bold text-obsidian">₹{formattedPrice}</span>
              <span className="text-xs text-obsidian-500 font-medium"> /night</span>
            </div>
          </div>

          {/* Bottom Editorial Info */}
          <div className="relative z-10 p-6">
            <div className="transform transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">
              <h3 className={`font-serif font-bold text-white mb-2 leading-snug tracking-tight ${
                featured ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
              }`}>
                {listing.title}
              </h3>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin size={14} className="shrink-0 text-avara-400" />
                <span className="text-sm font-medium truncate">
                  {listing.location}, {listing.country}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
