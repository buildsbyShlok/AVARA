import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, ArrowUpRight, Compass, Settings, ShieldCheck } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Avatar from '../components/ui/Avatar';
import Skeleton from '../components/ui/Skeleton';
import userService from '../services/userService';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPublicProfile() {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await userService.getUserProfile(username);
        setProfile(data.profile);
      } catch (err) {
        setNotFound(true);
        addToast(err.message || 'Curator profile not found', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPublicProfile();
  }, [username, addToast]);

  const isSelf = user && (user.username === username || user._id === profile?._id);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <Skeleton className="h-64 w-full !rounded-4xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 w-full !rounded-3xl" />
          <Skeleton className="h-72 w-full !rounded-3xl" />
          <Skeleton className="h-72 w-full !rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <PageTransition className="flex-1 flex items-center justify-center p-6 py-24">
        <div className="text-center max-w-md bg-white p-8 sm:p-12 rounded-4xl border border-obsidian-100 shadow-card">
          <div className="w-16 h-16 rounded-full bg-sand-200 mx-auto flex items-center justify-center text-obsidian-400 mb-4">
            <Compass size={28} />
          </div>
          <h2 className="font-serif font-bold text-2xl text-obsidian mb-2">Curator Not Found</h2>
          <p className="text-xs text-obsidian-500 mb-6 leading-relaxed">
            The profile for <span className="font-semibold text-obsidian">@{username}</span> does not exist or has been relocated.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-avara-500 hover:bg-avara-600 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Return to Explore</span>
          </Link>
        </div>
      </PageTransition>
    );
  }

  const joinDateFormatted = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'March 2026';

  return (
    <PageTransition className="flex-1 pb-24">
      {/* Return Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-obsidian-600 hover:text-avara-500 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to Explore</span>
        </Link>
      </div>

      {/* Public Profile Header */}
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-10">
        <div className="bg-white rounded-4xl p-6 sm:p-10 border border-obsidian-100/80 shadow-editorial relative overflow-hidden">
          {/* Subtle Monogram Watermark */}
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 font-serif text-[180px] font-black text-sand-100 select-none pointer-events-none">
            A
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 justify-between">
            {/* Identity & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar
                src={profile.profilePicture}
                name={profile.name || profile.username}
                size="2xl"
                className="ring-4 ring-sand-200"
              />

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-obsidian tracking-tight">
                    {profile.name || profile.username}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-avara-50 text-avara-600 border border-avara-200">
                    <ShieldCheck size={12} />
                    <span>Verified Curator</span>
                  </span>
                </div>

                <p className="text-sm font-medium text-obsidian-500 font-mono">
                  @{profile.username}
                </p>

                <p className="font-serif italic text-sm text-obsidian-700 max-w-lg pt-1">
                  &ldquo;{profile.bio || 'Curating timeless architecture and tranquil sanctuaries.'}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-obsidian-500 pt-1.5">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-avara-500" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-gold-500" />
                    <span>Curating since {joinDateFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions / Stats */}
            <div className="flex flex-col sm:flex-row items-center gap-4 self-stretch sm:self-auto justify-between md:justify-end">
              <div className="flex items-center gap-5 bg-sand-50 p-4 sm:p-5 rounded-3xl border border-obsidian-100/60 w-full sm:w-auto justify-around">
                <div className="text-center px-2">
                  <span className="block font-serif text-2xl sm:text-3xl font-bold text-obsidian">
                    {profile.destinationsCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-obsidian-400">
                    Sanctuaries
                  </span>
                </div>
                <div className="w-[1px] h-9 bg-obsidian-200/50" />
                <div className="text-center px-2">
                  <span className="block font-serif text-2xl sm:text-3xl font-bold text-gold-500">
                    5.0
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-obsidian-400">
                    Rating
                  </span>
                </div>
              </div>

              {isSelf && (
                <Link
                  to="/profile"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-obsidian hover:bg-obsidian-900 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm w-full sm:w-auto"
                >
                  <Settings size={14} />
                  <span>Edit Profile</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Published Sanctuaries Section */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-obsidian-100/80 pb-4">
            <div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-obsidian">
                Published Sanctuaries
              </h2>
              <p className="text-xs text-obsidian-500 mt-0.5">
                Architectural destinations hosted and managed by @{profile.username}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-obsidian-400">
              {profile.destinations?.length || 0} Listed
            </span>
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
                  <Link
                    key={listing._id}
                    to={`/listings/${listing._id}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-obsidian-100/70 shadow-sm hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-52 bg-sand-200 overflow-hidden">
                        <img
                          src={coverUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-obsidian shadow-sm">
                          ₹{formattedPrice} / night
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-serif font-bold text-lg text-obsidian mb-1 truncate group-hover:text-avara-500 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-obsidian-500 flex items-center gap-1 mb-2.5">
                          <MapPin size={12} className="text-avara-500 shrink-0" />
                          <span className="truncate">{listing.location}, {listing.country}</span>
                        </p>
                        <p className="text-xs text-obsidian-600 line-clamp-2 leading-relaxed">
                          {listing.description || 'Architectural sanctuary curated under AVARA standards.'}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 bg-sand-50/70 border-t border-obsidian-100/60 flex items-center justify-between text-xs font-bold text-obsidian group-hover:text-avara-500 transition-colors">
                      <span>Explore Destination</span>
                      <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-4xl border border-obsidian-100/60 p-8 shadow-sm">
              <Compass className="w-12 h-12 text-avara-400 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-xl text-obsidian mb-1">No Sanctuaries Published</h3>
              <p className="text-xs text-obsidian-500 max-w-sm mx-auto">
                @{profile.username} has not published any public listings yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
