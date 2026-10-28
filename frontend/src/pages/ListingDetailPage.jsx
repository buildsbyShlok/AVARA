import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Star, Edit3, Trash2, ShieldCheck, Sparkles, Camera, ArrowUpRight } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Skeleton from '../components/ui/Skeleton';
import Avatar from '../components/ui/Avatar';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewForm from '../components/reviews/ReviewForm';
import GalleryLightbox from '../components/listing/GalleryLightbox';
import { StarRatingDisplay } from '../components/ui/StarRating';
import listingService from '../services/listingService';
import reviewService from '../services/reviewService';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [listing, setListing] = useState(null);
  const reviews = listing?.reviews || [];
  const avgRating = reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : 0;
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        const data = await listingService.getById(id);
        setListing(data.listing);
      } catch (err) {
        addToast(err.message || 'Destination not found', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id, navigate, addToast]);

  const isOwner = user && listing?.owner && (user._id === listing.owner._id || user._id === listing.owner);

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to remove this sanctuary from AVARA?')) return;
    try {
      setDeleting(true);
      await listingService.delete(id);
      addToast('Sanctuary removed from AVARA', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Failed to delete listing', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddReview = async (reviewData) => {
    if (!user) {
      addToast('You must be logged in to leave a review', 'error');
      navigate('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await reviewService.create(id, reviewData);
      setListing(prev => ({
        ...prev,
        reviews: [res.review, ...(prev.reviews || [])]
      }));
      addToast('Review published to AVARA!', 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Failed to post review', 'error');
      return false;
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.delete(id, reviewId);
      setListing(prev => ({
        ...prev,
        reviews: prev.reviews.filter(r => r._id !== reviewId)
      }));
      addToast('Review removed', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-[480px] w-full !rounded-4xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton variant="text" className="w-2/3 h-8" />
            <Skeleton variant="text" className="w-1/3 h-5" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-full !rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const formattedPrice = new Intl.NumberFormat('en-IN').format(listing.price || 0);

  // Gallery images array
  const galleryImages = (listing.images && listing.images.length > 0)
    ? listing.images
    : (listing.image?.url ? [listing.image] : [{ url: 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60' }]);

  const coverImage = galleryImages.find(i => i.isCover) || galleryImages[0];
  const sideImage1 = galleryImages[1] || galleryImages[0];
  const sideImage2 = galleryImages[2] || sideImage1;

  const openLightboxAt = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const hostName = listing.owner?.name || listing.owner?.username || 'Host';

  return (
    <PageTransition className="flex-1 pb-24">
      {/* Lightbox Modal */}
      <GalleryLightbox
        images={galleryImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Top Breadcrumb & Return Action */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-obsidian-600 hover:text-avara-500 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Destinations</span>
        </Link>
      </div>

      {/* Editorial Multi-Image Showcase Gallery */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="relative rounded-4xl overflow-hidden shadow-editorial border border-obsidian-100/50 bg-sand-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-[380px] md:h-[520px]">
            {/* Main Featured Photo (Left) */}
            <div
              onClick={() => openLightboxAt(0)}
              className="md:col-span-8 relative h-full overflow-hidden cursor-pointer group"
            >
              <motion.img
                layoutId={`listing-image-${listing._id}`}
                src={coverImage.url}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Title & Metadata Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white pointer-events-none">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                    {listing.country}
                  </span>
                  {avgRating > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400 text-obsidian backdrop-blur-md shadow-sm">
                      <Star size={13} className="fill-current" />
                      <span>{avgRating} ({listing.reviews?.length || 0} reviews)</span>
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                  {listing.title}
                </h1>

                <div className="flex items-center gap-2 text-white/85 text-xs sm:text-sm font-medium">
                  <MapPin size={15} className="text-avara-400 shrink-0" />
                  <span>{listing.location}, {listing.country}</span>
                </div>
              </div>
            </div>

            {/* Stacked Secondary Photos (Right) */}
            <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-2 h-full">
              <div
                onClick={() => openLightboxAt(1)}
                className="relative h-full overflow-hidden cursor-pointer group bg-sand-300"
              >
                <img
                  src={sideImage1.url}
                  alt="Gallery 2"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              </div>

              <div
                onClick={() => openLightboxAt(2)}
                className="relative h-full overflow-hidden cursor-pointer group bg-sand-300"
              >
                <img
                  src={sideImage2.url}
                  alt="Gallery 3"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              </div>
            </div>
          </div>

          {/* Floating "View All Photos" Button */}
          <button
            onClick={() => openLightboxAt(0)}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/95 hover:bg-white text-obsidian text-xs font-bold uppercase tracking-wider rounded-full shadow-float backdrop-blur-md transition-transform active:scale-95 border border-obsidian-100"
          >
            <Camera size={14} className="text-avara-500" />
            <span>View All Photos ({galleryImages.length})</span>
          </button>
        </div>
      </section>

      {/* Main Content Split Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column: Host Details, Description, Reviews */}
          <div className="lg:col-span-2 space-y-12">
            {/* Host Sanctuary Card with AVARA Avatar */}
            <div className="bg-white rounded-4xl p-6 sm:p-8 border border-obsidian-100/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Link
                  to={listing.owner?.username ? `/users/${listing.owner.username}` : '#'}
                  className="group/host shrink-0"
                >
                  <Avatar
                    src={listing.owner?.profilePicture}
                    name={hostName}
                    size="lg"
                    className="group-hover/host:ring-2 group-hover/host:ring-avara-500 transition-all"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={listing.owner?.username ? `/users/${listing.owner.username}` : '#'}
                      className="group/name"
                    >
                      <h3 className="font-serif font-bold text-xl text-obsidian group-hover/name:text-avara-500 transition-colors">
                        Hosted by {hostName}
                      </h3>
                    </Link>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-avara-50 text-avara-600 border border-avara-200">
                      Verified Host
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <Link
                      to={listing.owner?.username ? `/users/${listing.owner.username}` : '#'}
                      className="text-xs font-mono font-medium text-avara-600 hover:underline"
                    >
                      @{listing.owner?.username || 'curator'}
                    </Link>
                    <span className="text-xs text-obsidian-400">&bull; {listing.owner?.location || 'AVARA Verified Host'}</span>
                    {listing.owner?.username && (
                      <Link
                        to={`/users/${listing.owner.username}`}
                        className="text-[11px] font-bold uppercase tracking-wider text-obsidian-600 hover:text-avara-500 inline-flex items-center gap-0.5 ml-1"
                      >
                        <span>View Profile</span>
                        <ArrowUpRight size={11} />
                      </Link>
                    )}
                  </div>
                  {listing.owner?.bio && (
                    <p className="font-serif italic text-xs text-obsidian-600 pt-1">
                      &ldquo;{listing.owner.bio}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Owner actions if logged in as owner */}
              {isOwner && (
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Link
                    to={`/listings/${listing._id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-obsidian-200 text-xs font-bold uppercase tracking-wider text-obsidian hover:bg-sand-100 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDeleteListing}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    <span>{deleting ? 'Removing...' : 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-obsidian">About this sanctuary</h2>
              <p className="text-obsidian-700 text-base md:text-lg leading-relaxed whitespace-pre-line font-normal">
                {listing.description || 'No detailed description provided for this destination.'}
              </p>
            </div>

            {/* Architectural Highlights */}
            <div className="border-t border-b border-obsidian-100/80 py-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-avara-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-obsidian">Architectural Purity</h4>
                  <p className="text-xs text-obsidian-500">Handpicked for spatial geometry, natural materials, and harmonious integration with the landscape.</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-obsidian">Verified Ownership</h4>
                  <p className="text-xs text-obsidian-500">Directly associated with verified curator @{listing.owner?.username || 'Host'}.</p>
                </div>
              </div>
            </div>

            {/* Reviews Section with Avatar */}
            <div className="space-y-8 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-1">
                    Traveler Reviews
                  </h3>
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay rating={avgRating} size={16} />
                    <span className="text-sm font-semibold text-obsidian">
                      {avgRating > 0 ? `${avgRating} / 5` : 'No reviews yet'}
                    </span>
                    <span className="text-xs text-obsidian-400">
                      ({listing.reviews?.length || 0} traveler {listing.reviews?.length === 1 ? 'perspective' : 'perspectives'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Submission Form */}
              <ReviewForm onSubmit={handleAddReview} isSubmitting={submittingReview} />

              {/* List of Reviews */}
              {listing.reviews && listing.reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.reviews.map((rev, index) => {
                    const canDeleteReview = user && rev.author && (user._id === rev.author._id || user._id === rev.author);
                    return (
                      <ReviewCard
                        key={rev._id}
                        review={rev}
                        canDelete={canDeleteReview}
                        onDelete={handleDeleteReview}
                        index={index}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-obsidian-100/50 p-6">
                  <p className="text-sm text-obsidian-500 font-medium">
                    No reviews yet. Be the first traveler to share your thoughts on this sanctuary!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Editorial Reservation Summary Card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-4xl p-6 md:p-8 border border-obsidian-100/80 shadow-float">
              {/* Nightly Rate */}
              <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-obsidian-100/70">
                <div>
                  <span className="font-serif text-3xl md:text-4xl font-extrabold text-obsidian">₹{formattedPrice}</span>
                  <span className="text-xs uppercase tracking-wider font-bold text-obsidian-400"> / night</span>
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-obsidian bg-sand-100 px-3 py-1.5 rounded-full">
                    <Star size={12} className="fill-gold text-gold" />
                    <span>{avgRating}</span>
                  </div>
                )}
              </div>

              {/* Destination Metadata */}
              <div className="bg-sand-100/70 rounded-3xl p-5 border border-obsidian-100/60 mb-6 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Region</span>
                  <span className="font-semibold text-obsidian text-right">{listing.location}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Country</span>
                  <span className="font-semibold text-obsidian text-right">{listing.country}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Curator</span>
                  <Link
                    to={listing.owner?.username ? `/users/${listing.owner.username}` : '#'}
                    className="font-semibold text-avara-600 hover:underline text-right"
                  >
                    @{listing.owner?.username || 'Host'}
                  </Link>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Gallery</span>
                  <span className="font-semibold text-obsidian text-right">{galleryImages.length} Photographs</span>
                </div>
              </div>

              {/* Pricing Transparency breakdown */}
              <div className="space-y-2.5 text-xs text-obsidian-600 mb-6">
                <div className="flex justify-between">
                  <span>Base sanctuary rate</span>
                  <span>₹{formattedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Care & maintenance</span>
                  <span className="text-forest font-semibold">Included</span>
                </div>
                <div className="flex justify-between font-bold text-obsidian pt-2 border-t border-obsidian-100 text-sm">
                  <span>Total (per night)</span>
                  <span>₹{formattedPrice}</span>
                </div>
              </div>

              <div className="p-4 bg-sand-100/60 rounded-2xl border border-obsidian-100/50 text-center">
                <p className="text-xs text-obsidian-500 leading-relaxed">
                  Direct inquiry and itinerary coordination with verified host <span className="font-semibold text-obsidian">{hostName}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
