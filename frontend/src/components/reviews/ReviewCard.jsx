import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { StarRatingDisplay } from '../ui/StarRating';
import { fadeUp } from '../../animations/variants';

export default function ReviewCard({ review, canDelete, onDelete, index = 0 }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const authorName = review.author?.name || review.author?.username || 'Traveler';
  const profileUrl = review.author?.username ? `/users/${review.author.username}` : '#';

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white rounded-3xl p-6 border border-obsidian-100/60 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <Link to={profileUrl} className="flex items-center gap-3 group/author">
            <Avatar
              src={review.author?.profilePicture}
              name={authorName}
              size="md"
              className="group-hover/author:ring-2 group-hover/author:ring-avara-500 transition-all"
            />
            <div>
              <p className="font-semibold text-sm text-obsidian group-hover/author:text-avara-500 transition-colors">
                {authorName}
              </p>
              <p className="text-xs text-obsidian-400">@{review.author?.username || 'user'} &bull; {date}</p>
            </div>
          </Link>
          {canDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(review._id)}
              className="p-2 rounded-xl hover:bg-red-50 text-obsidian-300 hover:text-red-600 transition-colors"
              title="Delete your review"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>
        <StarRatingDisplay rating={review.rating} size={15} className="mb-3" />
        <p className="text-sm text-obsidian-700 leading-relaxed font-normal">{review.comment}</p>
      </div>
    </motion.div>
  );
}
