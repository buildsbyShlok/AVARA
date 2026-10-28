import { Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-obsidian text-white/70 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand Intro */}
          <div className="space-y-4 max-w-sm">
            <Link to="/">
              <div className="flex items-center gap-3">
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                  <rect x="20" y="2" width="25.45" height="25.45" rx="5" transform="rotate(45 20 2)" stroke="#E0533C" strokeWidth="2.5" />
                  <path d="M13 27L20 12L27 27" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 22H24" stroke="#D49B3E" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="20" cy="17" r="1.8" fill="#E0533C" />
                </svg>
                <span className="font-serif tracking-[0.25em] font-extrabold text-xl text-white uppercase">
                  AVARA
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/55 leading-relaxed font-normal">
              An architectural travel operating system for discovering and hosting extraordinary sanctuaries across the globe.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Explore</h4>
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-xs text-white/80 hover:text-avara-400 transition-colors uppercase tracking-wider font-semibold">
                  All Destinations
                </Link>
                <Link to="/listings/new" className="text-xs text-white/80 hover:text-avara-400 transition-colors uppercase tracking-wider font-semibold">
                  Host a Sanctuary
                </Link>
                <Link to="/profile" className="text-xs text-white/80 hover:text-avara-400 transition-colors uppercase tracking-wider font-semibold">
                  Curator Profile
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Architecture</h4>
              <div className="flex flex-col gap-2.5 text-xs text-white/60">
                <span>Spatial Geometry</span>
                <span>Restrained Motion</span>
                <span>Editorial Visuals</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Network</h4>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors cursor-pointer" title="Global Network">
                  <Globe size={16} />
                </span>
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors cursor-pointer" title="Verified Stays">
                  <Shield size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} AVARA Operating System. Curated by Shlok Rajput.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">Privacy Charter</span>
            <span className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">Terms of Exploration</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
