import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Skeleton from '../components/ui/Skeleton';
import ImageUploader from '../components/ui/ImageUploader';
import listingService from '../services/listingService';
import uploadService from '../services/uploadService';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: ''
  });

  const [images, setImages] = useState([]);

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);
        const data = await listingService.getById(id);
        const l = data.listing;

        // Ownership check
        if (user && l.owner && user._id !== l.owner._id && user._id !== l.owner) {
          addToast('You do not have permission to edit this sanctuary', 'error');
          navigate(`/listings/${id}`);
          return;
        }

        setFormData({
          title: l.title || '',
          description: l.description || '',
          location: l.location || '',
          country: l.country || '',
          price: l.price ?? ''
        });

        // Set images
        if (l.images && l.images.length > 0) {
          setImages(l.images);
        } else if (l.image?.url) {
          setImages([{ url: l.image.url, filename: l.image.filename || 'cover', isCover: true }]);
        }
      } catch (err) {
        addToast(err.message || 'Failed to load destination', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [id, user, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      addToast('Please keep at least one image in the gallery', 'error');
      return;
    }
    try {
      setIsSubmitting(true);

      // Process uploaded images
      let processedImages = [];
      if (images.length > 0) {
        const uploadRes = await uploadService.uploadListingImages(images);
        processedImages = uploadRes.images || [];
      }

      const payload = {
        listing: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          country: formData.country.trim(),
          price: Number(formData.price)
        },
        images: processedImages.length > 0 ? processedImages : undefined
      };

      await listingService.update(id, payload);
      addToast('Sanctuary updated successfully!', 'success');
      navigate(`/listings/${id}`);
    } catch (err) {
      addToast(err.message || 'Failed to update destination', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton variant="text" className="w-48 h-6" />
        <Skeleton className="h-96 w-full !rounded-3xl" />
      </div>
    );
  }

  const coverImage = images.find(i => i.isCover)?.url || images[0]?.url || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';

  return (
    <PageTransition className="flex-1 py-12 max-w-6xl mx-auto px-6">
      <Link
        to={`/listings/${id}`}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-obsidian-600 hover:text-avara-500 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span>Cancel & Return to Sanctuary</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
          <div className="mb-8">
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-2">
              Edit Sanctuary Details
            </h1>
            <p className="text-xs md:text-sm text-obsidian-500">
              Update narrative, geographic setting, photography gallery, and pricing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                Sanctuary Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                Architectural Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Region / City
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  required
                />
              </div>
            </div>

            {/* Gallery Photography */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                Gallery Photos
              </label>
              <ImageUploader images={images} onChange={setImages} maxImages={8} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                Nightly Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Link
                to={`/listings/${id}`}
                className="px-6 py-2.5 rounded-full border border-obsidian-200 text-xs font-bold uppercase tracking-wider text-obsidian hover:bg-sand-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-avara-500 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-avara-600 disabled:opacity-50 transition-all shadow-md"
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save Sanctuary'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-obsidian-500">
            <span>Live Update Preview</span>
            <span className="text-forest">Synced</span>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-sand-200 border border-obsidian-100/50 shadow-editorial h-[420px] flex flex-col justify-end">
            <img
              src={coverImage}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/15">
                {formData.country || 'Global'}
              </span>
              <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm">
                <span className="text-sm font-bold text-obsidian">
                  ₹{formData.price ? new Intl.NumberFormat('en-IN').format(formData.price) : '0'}
                </span>
                <span className="text-xs text-obsidian-500 font-medium"> /night</span>
              </div>
            </div>

            <div className="relative z-10 p-6">
              <h3 className="font-serif font-bold text-2xl text-white mb-2 leading-snug">
                {formData.title || 'Sanctuary Title'}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80">
                <MapPin size={14} className="text-avara-400 shrink-0" />
                <span className="text-sm truncate">
                  {formData.location || 'Region'}, {formData.country || 'Country'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
