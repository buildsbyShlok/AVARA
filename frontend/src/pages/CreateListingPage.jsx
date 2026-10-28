import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import ImageUploader from '../components/ui/ImageUploader';
import listingService from '../services/listingService';
import uploadService from '../services/uploadService';
import { useToast } from '../context/ToastContext';

const STEPS = [
  { id: 1, name: 'Basics' },
  { id: 2, name: 'Location' },
  { id: 3, name: 'Photography' },
  { id: 4, name: 'Pricing' }
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: ''
  });

  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        addToast('Please enter a title for your sanctuary', 'error');
        return false;
      }
      if (!formData.description.trim()) {
        addToast('Please provide an architectural description', 'error');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.location.trim()) {
        addToast('Please specify the region or city', 'error');
        return false;
      }
      if (!formData.country.trim()) {
        addToast('Please specify the country', 'error');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.price || Number(formData.price) <= 0) {
        addToast('Please enter a valid positive nightly rate', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);

      // Process uploaded images if any are base64 data URLs
      let processedImages = [];
      if (images.length > 0) {
        const uploadRes = await uploadService.uploadListingImages(images);
        processedImages = uploadRes.images || [];
      } else {
        processedImages = [{
          url: 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60',
          filename: 'default_residence',
          isCover: true
        }];
      }

      const payload = {
        listing: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          country: formData.country.trim(),
          price: Number(formData.price),
        },
        images: processedImages
      };

      const res = await listingService.create(payload);

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });

      addToast('Sanctuary published to AVARA!', 'success');
      navigate(`/listings/${res.listing._id}`);
    } catch (err) {
      addToast(err.message || 'Failed to publish listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverImage = images.find(i => i.isCover)?.url || images[0]?.url || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';

  return (
    <PageTransition className="flex-1 py-12 max-w-6xl mx-auto px-6">
      {/* Return Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-obsidian-600 hover:text-avara-500 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span>Cancel & Return</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Multi-Step Interactive Form */}
        <div className="lg:col-span-7 bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
          {/* Step Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-avara-500">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-xs font-semibold text-obsidian-400">
                {STEPS[currentStep - 1].name}
              </span>
            </div>
            <div className="w-full bg-sand-200 h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-avara-500 h-full rounded-full"
                initial={false}
                animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-2">
                      Destination Details
                    </h2>
                    <p className="text-xs md:text-sm text-obsidian-500">
                      Give your sanctuary a memorable name and an evocative architectural narrative.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                      Sanctuary Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Glass Pavilion on the Tuscan Ridge"
                      className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                      Architectural Narrative & Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe the light, materials, geography, and atmosphere..."
                      className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 resize-none transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-2">
                      Geographic Location
                    </h2>
                    <p className="text-xs md:text-sm text-obsidian-500">
                      Specify the coordinates and setting of this residence.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                      City / Region / Setting
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Florence, Tuscany"
                      className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all"
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
                      placeholder="e.g. Italy"
                      className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-2">
                      Residence Photography
                    </h2>
                    <p className="text-xs md:text-sm text-obsidian-500">
                      Upload high-resolution photography. You can set any photo as the main cover.
                    </p>
                  </div>

                  {/* Multi-Image Drag and Drop Uploader */}
                  <ImageUploader
                    images={images}
                    onChange={setImages}
                    maxImages={8}
                  />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-serif font-bold text-2xl md:text-3xl text-obsidian mb-2">
                      Nightly Rate & Final Review
                    </h2>
                    <p className="text-xs md:text-sm text-obsidian-500">
                      Set the price per night in Indian Rupees (₹).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                      Price per Night (₹)
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
                        placeholder="2500"
                        className="w-full pl-9 pr-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-sand-100 p-4 rounded-2xl border border-obsidian-100 text-xs text-obsidian-600 space-y-1">
                    <p className="font-bold text-obsidian">AVARA Curator Terms</p>
                    <p>This residence will be indexed under your account and visible across the global AVARA network.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Controls */}
            <div className="mt-10 pt-6 border-t border-obsidian-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-obsidian-200 text-xs font-bold uppercase tracking-wider text-obsidian hover:bg-sand-100 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>
              ) : <div />}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-obsidian text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-obsidian-900 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-avara-500 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-avara-600 disabled:opacity-50 transition-all shadow-md"
                >
                  <Sparkles size={15} />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish to AVARA'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Discovery Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-obsidian-500">
            <span>Live Discovery Preview</span>
            <span className="text-avara-500">Synced</span>
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
                {formData.country.trim() || 'Global'}
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
                {formData.title.trim() || 'Sanctuary Title'}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80">
                <MapPin size={14} className="text-avara-400 shrink-0" />
                <span className="text-sm truncate">
                  {formData.location.trim() || 'Region'}, {formData.country.trim() || 'Country'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
