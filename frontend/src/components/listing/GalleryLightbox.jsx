import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GalleryLightbox({
  images = [],
  initialIndex = 0,
  isOpen = false,
  onClose
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImg = images[currentIndex];
  const currentUrl = typeof currentImg === 'object' ? currentImg.url : currentImg;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 select-none"
      >
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between text-white z-10">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg font-bold tracking-widest text-gold-300">AVARA</span>
            <span className="text-white/40">|</span>
            <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
              Residence Gallery
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-white/60 tracking-wider">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Central Stage */}
        <div className="relative flex-1 flex items-center justify-center py-4">
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Active Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-5xl max-h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <img
              src={currentUrl}
              alt={`Gallery photo ${currentIndex + 1}`}
              className="max-h-[75vh] w-auto object-contain mx-auto"
            />
          </motion.div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {images.map((img, idx) => {
              const url = typeof img === 'object' ? img.url : img;
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-16 h-12 rounded-xl overflow-hidden transition-all shrink-0 ${
                    isActive ? 'ring-2 ring-gold-400 scale-105 opacity-100' : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
