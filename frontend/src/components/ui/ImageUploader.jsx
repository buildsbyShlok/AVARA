import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Star, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 8
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleFiles = async (files) => {
    const available = Math.max(0, maxImages - images.length);
    const candidates = Array.from(files || []);
    if (candidates.length > available) addToast('A gallery supports up to ' + maxImages + ' images', 'error');
    const accepted = candidates.filter(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        addToast('Choose JPG, PNG or WEBP images up to 10MB each', 'error');
        return false;
      }
      return true;
    }).slice(0, available);
    const loaded = await Promise.all(accepted.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = event => resolve({ dataUrl: event.target.result, url: event.target.result, filename: file.name, isCover: false });
      reader.onerror = () => { addToast('An image could not be read. Please try again.', 'error'); resolve(null); };
      reader.readAsDataURL(file);
    })));
    onChange(prev => {
      const next = [...prev, ...loaded.filter(Boolean).slice(0, Math.max(0, maxImages - prev.length))];
      const coverIndex = Math.max(0, next.findIndex(image => image.isCover));
      return next.map((image, index) => ({ ...image, isCover: index === coverIndex }));
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (indexToRemove) => {
    onChange(prev => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      // If we removed the cover image, make the first remaining image the cover
      if (filtered.length > 0 && !filtered.some(img => img.isCover)) {
        filtered[0] = { ...filtered[0], isCover: true };
      }
      return filtered;
    });
  };

  const handleSetCover = (indexToCover) => {
    onChange(prev =>
      prev.map((img, idx) => ({
        ...img,
        isCover: idx === indexToCover
      }))
    );
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      addToast('A gallery supports up to ' + maxImages + ' images', 'error');
      return;
    }
    try {
      const url = new URL(urlInput.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      addToast('Enter a valid HTTP or HTTPS image URL', 'error');
      return;
    }
    const newImage = {
      url: urlInput.trim(),
      filename: `photo_${images.length + 1}`,
      isCover: images.length === 0
    };
    onChange(prev => prev.length >= maxImages ? prev : [...prev, { ...newImage, isCover: prev.length === 0 }]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
          isDragging
            ? 'border-avara-500 bg-avara-50/50 scale-[1.01]'
            : 'border-obsidian-200 hover:border-obsidian-400 bg-sand-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center text-avara-500 mb-3">
          <UploadCloud size={26} />
        </div>

        <h4 className="font-serif font-bold text-base text-obsidian mb-1">
          Drop residence photography here
        </h4>
        <p className="text-xs text-obsidian-400 max-w-sm leading-relaxed mb-3">
          High-resolution JPG, PNG or WEBP formats up to 10MB each. Multiple files supported.
        </p>

        <div className="flex items-center gap-2">
          <span className="px-4 py-1.5 rounded-full bg-obsidian text-white text-xs font-semibold shadow-sm hover:bg-obsidian-900 transition-colors">
            Browse Computer
          </span>
          <span className="text-xs text-obsidian-400 font-medium">or</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowUrlInput(!showUrlInput); }}
            className="px-3.5 py-1.5 rounded-full border border-obsidian-200 text-xs font-semibold text-obsidian-700 hover:bg-sand-100 transition-colors flex items-center gap-1.5"
          >
            <LinkIcon size={12} />
            <span>Paste URL</span>
          </button>
        </div>
      </div>

      {/* Alternative URL Input Accordion */}
      {showUrlInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 bg-sand-100 p-3 rounded-2xl border border-obsidian-100"
        >
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="flex-1 px-4 py-2 text-xs bg-white rounded-xl border border-obsidian-200 focus:outline-none focus:ring-2 focus:ring-avara-500/20"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-obsidian text-white rounded-xl text-xs font-semibold hover:bg-obsidian-900 transition-colors"
          >
            Add Photo
          </button>
        </motion.div>
      )}

      {/* Uploaded Images Preview Grid */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-obsidian-500 mb-3">
            <span>Residence Gallery ({images.length} of {maxImages})</span>
            <span className="text-avara-500 text-[11px] font-semibold">★ Click star to change cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative rounded-2xl overflow-hidden aspect-[4/3] group border shadow-sm ${
                    img.isCover ? 'ring-2 ring-avara-500 border-avara-500' : 'border-obsidian-200'
                  }`}
                >
                  <img
                    src={img.url || img.dataUrl}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      title="Set as main cover image"
                      className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95 ${
                        img.isCover
                          ? 'bg-avara-500 text-white'
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                    >
                      <Star size={10} className={img.isCover ? 'fill-white' : ''} />
                      <span>{img.isCover ? 'Cover' : 'Set Cover'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
