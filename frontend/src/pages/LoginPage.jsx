import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('Please provide your username.');
      return;
    }
    if (!password) {
      setError('Please provide your password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login({ username: trimmedUser, password });
      addToast('Welcome back to AVARA.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Invalid username or password.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="flex-1 flex h-full max-h-[calc(100vh-4.5rem)] overflow-y-auto lg:overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 w-full">
        {/* Left Column: Cinematic Visual & Monograph Quote */}
        <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-obsidian text-white overflow-hidden select-none">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
            alt="Cinematic Journey"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />

          {/* Top Logo */}
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

          {/* Bottom Monograph Quote */}
          <div className="relative z-10 max-w-lg space-y-4">
            <span className="text-[11px] uppercase tracking-widest text-gold-300 font-bold">
              Travel Monograph &bull; Vol. V
            </span>
            <blockquote className="font-serif text-3xl font-medium leading-snug text-sand-50">
              &ldquo;The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.&rdquo;
            </blockquote>
            <p className="text-xs text-white/50">&mdash; Marcel Proust</p>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-sand-50 overflow-y-auto">
          <div className="w-full max-w-md my-auto space-y-6 sm:space-y-8 bg-white p-6 sm:p-10 rounded-4xl border border-obsidian-100/80 shadow-card">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-avara-50 text-avara-600 text-xs font-semibold mb-3">
                <span>AVARA Access</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-obsidian tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-obsidian-500 mt-1">
                Enter your credentials to manage your residences and curate reviews.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Username
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
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-obsidian-700 mb-2">
                  Password
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-11 pr-12 py-3 rounded-2xl border border-obsidian-200 bg-sand-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-avara-500/20 focus:border-avara-500 disabled:opacity-50 transition-all"
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
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-avara-500 hover:bg-avara-600 text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-md mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-obsidian-100 text-center">
              <p className="text-xs text-obsidian-500">
                New to the platform?{' '}
                <Link to="/signup" className="font-bold text-avara-500 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
