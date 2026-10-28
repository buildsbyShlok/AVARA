import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

export default function NotFoundPage() {
  return (
    <PageTransition className="flex-1 flex items-center justify-center p-6 py-24 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-full bg-sand-200 mx-auto flex items-center justify-center text-avara-500 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="20" y="2" width="25.45" height="25.45" rx="5" transform="rotate(45 20 2)" stroke="#E0533C" strokeWidth="2.5" />
            <path d="M13 27L20 12L27 27" stroke="#0B0F15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 22H24" stroke="#D49B3E" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-extrabold text-obsidian tracking-tight">
          Lost in Transit
        </h1>
        <p className="text-sm md:text-base text-obsidian-600 leading-relaxed font-normal">
          The coordinates you entered don't correspond to an active sanctuary on the AVARA network.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-obsidian text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-obsidian-900 transition-colors shadow-md"
        >
          <ArrowLeft size={16} />
          <span>Return to All Destinations</span>
        </Link>
      </div>
    </PageTransition>
  );
}
