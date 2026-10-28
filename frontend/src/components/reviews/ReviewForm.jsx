import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { StarRatingInput } from '../ui/StarRating';

export default function ReviewForm({ onSubmit, isSubmitting = false }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    const posted = await onSubmit({ rating, comment: comment.trim() });
    if (!posted) return;
    setRating(5);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-sand-100/80 rounded-3xl p-6 md:p-8 border border-obsidian-100/60 shadow-sm">
      <h4 className="font-serif font-bold text-xl md:text-2xl text-obsidian mb-2">Leave a Traveler Review</h4>
      <p className="text-xs md:text-sm text-obsidian-500 mb-6">Rate this destination and share your genuine perspective with fellow wanderers.</p>

      <div className="mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-600 mb-2">Your Rating</label>
        <div className="flex items-center gap-3">
          <StarRatingInput value={rating} onChange={setRating} size={28} />
          <span className="text-xs font-semibold text-gold-600 bg-gold-50 px-2.5 py-1 rounded-full border border-gold-200">
            {rating} of 5 Stars
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-600 mb-2">Your Commentary</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What made this place unforgettable? Describe the atmosphere, location, or unique moments..."
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border border-obsidian-200/80 bg-white text-sm text-obsidian placeholder-obsidian-400 focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 resize-none transition-all shadow-inner"
          required
        />
      </div>

      <motion.button
        type="submit"
        disabled={rating === 0 || !comment.trim() || isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-avara-500 text-white rounded-full text-sm font-semibold tracking-wide shadow-md hover:bg-avara-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Send size={15} />
        {isSubmitting ? 'Posting Review...' : 'Publish Review'}
      </motion.button>
    </form>
  );
}
