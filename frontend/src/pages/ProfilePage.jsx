import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Edit3, Lock, Plus, LogOut, Camera, Check, Trash2, ArrowUpRight, Compass, AtSign, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Sparkles, Key } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Avatar from '../components/ui/Avatar';
import Skeleton from '../components/ui/Skeleton';
import userService from '../services/userService';
import uploadService from '../services/uploadService';
import listingService from '../services/listingService';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { logout, checkAuth, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active settings tab: 'destinations' | 'personal' | 'identity' | 'security' | 'account'
  const [activeTab, setActiveTab] = useState('destinations');

  // Personal Information Form
  const [personalForm, setPersonalForm] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    email: ''
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Username Change Form
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await userService.getMyProfile();
        setProfile(data.profile);
        setPersonalForm({
          name: data.profile.name || '',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          phone: data.profile.phone || '',
          email: data.profile.email || ''
        });
        setNewUsername(data.profile.username || '');
      } catch (err) {
        addToast(err.message || 'Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [addToast]);

  // Avatar Upload Handler
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPEG, PNG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target.result;
        const uploadRes = await uploadService.uploadAvatar(dataUrl, file.name);
        const updatedAvatar = { url: uploadRes.url, filename: uploadRes.filename };

        // Save avatar to profile on server
        await userService.updateProfile({ profilePicture: updatedAvatar });

        setProfile((prev) => ({
          ...prev,
          profilePicture: updatedAvatar
        }));

        if (updateUser) {
          updateUser((prev) => ({
            ...prev,
            profilePicture: updatedAvatar
          }));
        }

        await checkAuth();
        addToast('Curator portrait updated successfully!', 'success');
      } catch (err) {
        addToast(err.message || 'Avatar upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Personal Information Save Handler
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSavingPersonal(true);
      const res = await userService.updateProfile({
        name: personalForm.name,
        bio: personalForm.bio,
        location: personalForm.location,
        phone: personalForm.phone
      });

      setProfile(res.profile);
      if (updateUser) {
        updateUser(res.profile);
      }
      await checkAuth();
      addToast('Personal information updated.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update personal details', 'error');
    } finally {
      setSavingPersonal(false);
    }
  };

  // Username Change Handler with Client Validation
  const validateUsernameInput = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username cannot be blank.';
    if (trimmed.length < 3) return 'Username must be at least 3 characters.';
    if (trimmed.length > 30) return 'Username must not exceed 30 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username may only contain letters, numbers, and underscores.';
    }
    if (profile && trimmed.toLowerCase() === profile.username.toLowerCase()) {
      return 'This is already your active handle.';
    }
    return '';
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    const validationErr = validateUsernameInput(newUsername);
    if (validationErr) {
      setUsernameError(validationErr);
      return;
    }

    try {
      setSavingUsername(true);
      const res = await userService.changeUsername(newUsername.trim());

      setProfile(res.profile);
      if (updateUser) {
        updateUser(res.user);
      }
      await checkAuth();

      setUsernameSuccess(`Your explorer handle is now @${res.user.username}`);
      addToast(`Username successfully changed to @${res.user.username}`, 'success');
    } catch (err) {
      const errMsg = err.message || 'Failed to change username.';
      setUsernameError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setSavingUsername(false);
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.oldPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      addToast('Password updated securely!', 'success');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err) {
      const errMsg = err.message || 'Failed to change password.';
      setPasswordError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete Listing from Profile
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to permanently remove this destination?')) return;
    try {
      await listingService.delete(listingId);
      setProfile((prev) => ({
        ...prev,
        destinationsCount: prev.destinationsCount - 1,
        destinations: prev.destinations.filter((d) => d._id !== listingId)
      }));
      addToast('Sanctuary removed from your portfolio', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete destination', 'error');
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out of AVARA.', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Logout failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <Skeleton className="h-64 w-full !rounded-4xl" />
        <Skeleton className="h-96 w-full !rounded-3xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <PageTransition className="flex-1 pb-24">
      {/* Editorial Profile Header Card */}
      <section className="bg-sand-100/70 border-b border-obsidian-100/60 pt-10 pb-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-editorial relative overflow-hidden">
            {/* Subtle atmospheric watermark */}
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 font-serif text-[180px] font-black text-sand-100 select-none pointer-events-none">
              A
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 justify-between">
              {/* Avatar & Identifiers */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group shrink-0">
                  <Avatar
                    src={profile.profilePicture}
                    name={profile.name || profile.username}
                    size="2xl"
                    className="ring-4 ring-sand-200"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer select-none"
                    title="Upload portrait photo"
                  >
                    <Camera size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Change</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-obsidian tracking-tight">
                      {profile.name || profile.username}
                    </h1>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-avara-50 text-avara-600 border border-avara-200">
                      Verified Curator
                    </span>
                  </div>

                  <p className="text-sm font-medium text-obsidian-500 font-mono">
                    @{profile.username} &bull; <span className="text-obsidian-400 font-sans">{profile.email}</span>
                  </p>

                  <p className="font-serif italic text-sm text-obsidian-700 max-w-lg pt-1">
                    &ldquo;{profile.bio || 'Curating architectural sanctuaries and cinematic retreats.'}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-obsidian-500 pt-1">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-avara-500" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <Link
                      to={`/users/${profile.username}`}
                      className="text-xs font-bold text-avara-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Public Profile</span>
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Portfolio Metrics */}
              <div className="flex items-center gap-4 sm:gap-6 bg-sand-50 p-4 sm:p-5 rounded-3xl border border-obsidian-100/60 self-stretch sm:self-auto justify-around shrink-0">
                <div className="text-center px-3">
                  <span className="block font-serif text-2xl sm:text-3xl font-bold text-obsidian">
                    {profile.destinationsCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-obsidian-400">
                    Sanctuaries
                  </span>
                </div>
                <div className="w-[1px] h-10 bg-obsidian-200/50" />
                <div className="text-center px-3">
                  <span className="block font-serif text-2xl sm:text-3xl font-bold text-gold-500">
                    5.0
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-obsidian-400">
                    Host Rating
                  </span>
                </div>
              </div>
            </div>

            {/* Polished AVARA Settings Tabs */}
            <div className="mt-8 pt-6 border-t border-obsidian-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('destinations')}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'destinations'
                    ? 'bg-obsidian text-white shadow-sm'
                    : 'text-obsidian-600 hover:bg-sand-100'
                }`}
              >
                Your Destinations ({profile.destinationsCount})
              </button>

              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-obsidian text-white shadow-sm'
                    : 'text-obsidian-600 hover:bg-sand-100'
                }`}
              >
                Personal Information
              </button>

              <button
                onClick={() => setActiveTab('identity')}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'identity'
                    ? 'bg-obsidian text-white shadow-sm'
                    : 'text-obsidian-600 hover:bg-sand-100'
                }`}
              >
                Profile & Identity
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'security'
                    ? 'bg-obsidian text-white shadow-sm'
                    : 'text-obsidian-600 hover:bg-sand-100'
                }`}
              >
                Security
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'account'
                    ? 'bg-obsidian text-white shadow-sm'
                    : 'text-obsidian-600 hover:bg-sand-100'
                }`}
              >
                Account Actions
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Panels */}
      <section className="max-w-6xl mx-auto px-6 pt-10">
        {/* TAB 1: YOUR DESTINATIONS */}
        {activeTab === 'destinations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-2xl text-obsidian">Your Hosted Destinations</h2>
                <p className="text-xs text-obsidian-500">Residences managed and curated under your AVARA account.</p>
              </div>
              <Link
                to="/listings/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-avara-500 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-avara-600 transition-all shadow-sm w-fit"
              >
                <Plus size={14} />
                <span>Host New Destination</span>
              </Link>
            </div>

            {profile.destinations && profile.destinations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.destinations.map((listing) => {
                  const coverUrl =
                    listing.image?.url ||
                    listing.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&q=60';
                  const formattedPrice = new Intl.NumberFormat('en-IN').format(listing.price || 0);

                  return (
                    <div
                      key={listing._id}
                      className="bg-white rounded-3xl overflow-hidden border border-obsidian-100/70 shadow-sm hover:shadow-card transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-48 bg-sand-200 overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-obsidian shadow-sm">
                            ₹{formattedPrice}/night
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="font-serif font-bold text-lg text-obsidian mb-1 truncate">
                            {listing.title}
                          </h3>
                          <p className="text-xs text-obsidian-500 flex items-center gap-1 mb-3">
                            <MapPin size={12} className="text-avara-500 shrink-0" />
                            <span className="truncate">{listing.location}, {listing.country}</span>
                          </p>
                          <p className="text-xs text-obsidian-600 line-clamp-2 leading-relaxed">
                            {listing.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="p-4 bg-sand-50 border-t border-obsidian-100 flex items-center justify-between">
                        <Link
                          to={`/listings/${listing._id}`}
                          className="text-xs font-bold text-obsidian hover:text-avara-500 flex items-center gap-1 transition-colors"
                        >
                          <span>View Detail</span>
                          <ArrowUpRight size={12} />
                        </Link>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/listings/${listing._id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-sand-200 text-obsidian-600 transition-colors"
                            title="Edit Listing"
                          >
                            <Edit3 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-4xl border border-obsidian-100/60 p-8 shadow-sm">
                <Compass className="w-12 h-12 text-avara-400 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-xl text-obsidian mb-2">No Destinations Yet</h3>
                <p className="text-xs text-obsidian-500 max-w-sm mx-auto mb-6">
                  You haven't listed any residences yet. Publish your first architectural haven on AVARA.
                </p>
                <Link
                  to="/listings/new"
                  className="px-6 py-2.5 bg-avara-500 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-avara-600 transition-all shadow-sm"
                >
                  Publish a Destination
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="max-w-2xl bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
            <div className="mb-8">
              <h2 className="font-serif font-bold text-2xl text-obsidian mb-1">Personal Information</h2>
              <p className="text-xs text-obsidian-500">
                Update how your name, location, and travel philosophy are displayed across the AVARA platform.
              </p>
            </div>

            <form onSubmit={handleSavePersonal} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Shlok Rajput"
                  className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Curator Bio / Tagline
                </label>
                <textarea
                  value={personalForm.bio}
                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Architectural Curator • Traveler • Discoverer"
                  className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={personalForm.location}
                    onChange={(e) => setPersonalForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. New Delhi, India"
                    className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-1">
                  Email Address
                </label>
                <p className="text-[11px] text-obsidian-400 mb-2">Used for security alerts and inquiry notifications.</p>
                <input
                  type="email"
                  value={personalForm.email}
                  disabled
                  className="w-full px-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-100 text-obsidian-500 text-sm cursor-not-allowed select-none font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-obsidian-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('destinations')}
                  className="px-6 py-2.5 rounded-full border border-obsidian-200 text-xs font-bold text-obsidian hover:bg-sand-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="px-8 py-3 bg-avara-500 hover:bg-avara-600 text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {savingPersonal ? 'Saving...' : 'Save Personal Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PROFILE & IDENTITY (AVATAR & USERNAME EDITING) */}
        {activeTab === 'identity' && (
          <div className="max-w-2xl space-y-8">
            {/* Sub-card 1: Profile Portrait */}
            <div className="bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
              <h2 className="font-serif font-bold text-2xl text-obsidian mb-1">Curator Portrait</h2>
              <p className="text-xs text-obsidian-500 mb-6">
                Your portrait appears on your published sanctuaries, reviews, and throughout the AVARA interface.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-sand-50/70 border border-obsidian-100/60">
                <Avatar
                  src={profile.profilePicture}
                  name={profile.name || profile.username}
                  size="xl"
                  className="ring-4 ring-white shadow-sm shrink-0"
                />

                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="font-semibold text-sm text-obsidian">Upload a new photograph</h3>
                  <p className="text-xs text-obsidian-500 leading-relaxed max-w-sm">
                    High resolution JPG, PNG or WEBP recommended. Image is automatically stored and cropped.
                  </p>
                  <div className="pt-1">
                    <label
                      htmlFor="identity-avatar-upload"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-obsidian hover:bg-obsidian-900 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                    >
                      <Camera size={14} />
                      <span>Select Photo</span>
                      <input
                        id="identity-avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-card 2: Change Username Handle (ITEM 1) */}
            <div className="bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AtSign size={20} className="text-avara-500" />
                <h2 className="font-serif font-bold text-2xl text-obsidian">Explorer Handle</h2>
              </div>
              <p className="text-xs text-obsidian-500 mb-6">
                Your unique handle defines your AVARA public URL (<span className="font-mono text-obsidian">/users/{profile.username}</span>) and attribution.
              </p>

              {/* Status / Feedback Banners */}
              {usernameError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{usernameError}</span>
                </div>
              )}

              {usernameSuccess && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{usernameSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangeUsername} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                    New Username Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400 font-mono text-sm font-bold">
                      @
                    </span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value);
                        if (usernameError) setUsernameError('');
                        if (usernameSuccess) setUsernameSuccess('');
                      }}
                      placeholder="e.g. shlokrajput"
                      disabled={savingUsername}
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-obsidian-500">
                    <span>&bull; 3–30 characters</span>
                    <span>&bull; Letters, numbers, and underscores only</span>
                    <span>&bull; Must be globally unique</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sand-50 border border-obsidian-100 text-xs text-obsidian-600 flex items-start gap-3">
                  <Sparkles size={16} className="text-avara-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Updating your username immediately updates your public profile, listing host card, traveler reviews, and navbar menu without ending your current session.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-obsidian-100">
                  <button
                    type="button"
                    onClick={() => {
                      setNewUsername(profile.username);
                      setUsernameError('');
                      setUsernameSuccess('');
                    }}
                    className="px-6 py-2.5 rounded-full border border-obsidian-200 text-xs font-bold text-obsidian hover:bg-sand-100 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={savingUsername || newUsername.trim() === profile.username}
                    className="flex items-center gap-2 px-8 py-3 bg-avara-500 hover:bg-avara-600 text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {savingUsername ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Validating & Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Username Handle</span>
                        <Check size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT SECURITY (PASSWORD CHANGE) */}
        {activeTab === 'security' && (
          <div className="max-w-xl bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Key size={20} className="text-avara-500" />
              <h2 className="font-serif font-bold text-2xl text-obsidian">Security & Credentials</h2>
            </div>
            <p className="text-xs text-obsidian-500 mb-6">
              Update your authentication credentials securely. Protected by Passport Local salted SHA hashing.
            </p>

            {passwordError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-6">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }));
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    disabled={changingPassword}
                    className="w-full pl-11 pr-12 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-600 transition-colors"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Create a strong new password"
                    autoComplete="new-password"
                    disabled={changingPassword}
                    className="w-full pl-11 pr-12 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Re-type new password"
                    autoComplete="new-password"
                    disabled={changingPassword}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-obsidian-100">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="px-6 py-2.5 rounded-full border border-obsidian-200 text-xs font-bold text-obsidian hover:bg-sand-100 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-8 py-3 bg-obsidian hover:bg-obsidian-900 text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: ACCOUNT ACTIONS */}
        {activeTab === 'account' && (
          <div className="max-w-xl space-y-6">
            <div className="bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif font-bold text-2xl text-obsidian mb-1">Account & Session</h2>
                <p className="text-xs text-obsidian-500">
                  Manage your authenticated session and public profile visibility.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-sand-50 border border-obsidian-100/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Account ID</span>
                  <span className="font-mono text-obsidian font-semibold truncate max-w-[200px]">{profile._id}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Public Profile</span>
                  <Link
                    to={`/users/${profile.username}`}
                    className="text-avara-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>/users/{profile.username}</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian-400 uppercase tracking-wider">Security State</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Session Verified</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-obsidian-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-colors w-full cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Log Out of AVARA</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageTransition>
  );
}
