import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedUser) {
      setError('Please choose a username handle.');
      return;
    }
    if (trimmedUser.length < 3 || trimmedUser.length > 30) {
      setError('Username must be between 3 and 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setError('Username may only contain letters, numbers, and underscores.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup({
        username: trimmedUser,
        name: trimmedName || trimmedUser,
        email: trimmedEmail,
        password
      });
      addToast('Welcome to the AVARA Collective.', 'success');
      navigate('/');
    } catch (err) {
      const errMsg = err.message || 'Registration failed. Please check your details.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="flex-1 flex h-full max-h-[calc(100vh-4.5rem)] overflow-y-auto lg:overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 w-full">
        {/* Left Column: Visual Showcase */}
        <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-obsidian text-white overflow-hidden select-none">
          <img
            src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=80"
            alt="AVARA Wilderness"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />

          <div className="relative z-10">
            <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-gold-400 rounded-xl">
              <div className="flex items-center gap-3">
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                  <rect x="20" y="2" width="25.45" height="25.45" rx="5" transform="rotate(45 20 2)" stroke="#E0533C" strokeWidth="2.5" />
                  <path d="M13 27L20 12L27 27" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 22H24" stroke="#D49B3E" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="20" cy="17" r="1.8" fill="#E0533C" />
                </svg>
                <span className="font-serif tracking-[0.25em] font-extrabold text-2xl text-white uppercase">
                  AVARA
                </span>
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-lg space-y-4">
            <span className="text-[11px] uppercase tracking-widest text-gold-300 font-bold">
              Join The Collective
            </span>
            <blockquote className="font-serif text-3xl font-medium leading-snug text-sand-50">
              &ldquo;To travel is to discover that everyone is wrong about other countries.&rdquo;
            </blockquote>
            <p className="text-xs text-white/50">&mdash; Aldous Huxley</p>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-sand-50 overflow-y-auto">
          <div className="w-full max-w-md my-auto space-y-6 bg-white p-6 sm:p-10 rounded-4xl border border-obsidian-100/80 shadow-card">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-avara-50 text-avara-600 text-xs font-semibold mb-3">
                <span>Curator Onboarding</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-obsidian tracking-tight">
                Begin your journey
              </h2>
              <p className="text-xs sm:text-sm text-obsidian-500 mt-1">
                Register to host architectural sanctuaries and publish verified reviews.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shlok Rajput"
                    autoComplete="name"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-1.5">
                  Username Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. shlokrajput"
                    autoComplete="username"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-1.5">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full pl-11 pr-12 py-2.5 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-avara-500 hover:bg-avara-600 text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-md mt-4 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Sign Up</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-obsidian-100 text-center">
              <p className="text-xs text-obsidian-500">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-avara-500 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
