import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, LogOut, Menu, X, ChevronDown, Compass } from 'lucide-react';
import AvaraLogo from './AvaraLogo';
import Avatar from '../ui/Avatar';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out from AVARA', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Logout failed', 'error');
    }
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-obsidian-100/60">
      <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
        {/* AVARA Logo */}
        <Link to="/">
          <AvaraLogo />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className="px-4 py-2 text-xs uppercase tracking-wider font-bold text-obsidian-700 hover:text-avara-500 transition-colors rounded-xl hover:bg-avara-50"
          >
            Explore
          </Link>
          {isAuthenticated && (
            <Link
              to="/listings/new"
              className="flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-bold text-obsidian-700 hover:text-avara-500 transition-colors rounded-xl hover:bg-avara-50"
            >
              <Plus size={15} />
              <span>Host Destination</span>
            </Link>
          )}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-obsidian-200/80 hover:shadow-card transition-all bg-white"
              >
                <Avatar
                  src={user.profilePicture}
                  name={user.name || user.username}
                  size="sm"
                  border={false}
                />
                <span className="text-xs font-bold text-obsidian tracking-wide">
                  {user.name || user.username}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-obsidian-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-3xl shadow-float border border-obsidian-100 py-2 overflow-hidden z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-obsidian-50">
                      <p className="text-xs font-bold text-obsidian truncate">{user.name || user.username}</p>
                      <p className="text-[10px] text-obsidian-400 font-mono truncate">@{user.username}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-obsidian-700 hover:bg-sand-100 transition-colors"
                    >
                      <User size={15} className="text-avara-500" />
                      <span>Profile & Settings</span>
                    </Link>

                    <Link
                      to={`/users/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-obsidian-700 hover:bg-sand-100 transition-colors"
                    >
                      <Compass size={15} className="text-gold-500" />
                      <span>View Public Profile</span>
                    </Link>

                    <Link
                      to="/listings/new"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-obsidian-700 hover:bg-sand-100 transition-colors"
                    >
                      <Plus size={15} className="text-avara-500" />
                      <span>Host Destination</span>
                    </Link>

                    <div className="border-t border-obsidian-50 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-5 py-2 text-xs uppercase tracking-wider font-bold text-obsidian-700 hover:text-avara-500 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold text-white bg-avara-500 hover:bg-avara-600 rounded-full transition-colors shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-2xl hover:bg-sand-200 transition-colors text-obsidian"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white border-t border-obsidian-100"
          >
            <div className="px-6 py-4 flex flex-col gap-1.5">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-obsidian rounded-2xl hover:bg-sand-100"
              >
                Explore Destinations
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-xs uppercase tracking-wider font-bold text-obsidian rounded-2xl hover:bg-sand-100"
                  >
                    <Avatar src={user.profilePicture} name={user.name || user.username} size="xs" />
                    <span>Profile & Settings</span>
                  </Link>

                  <Link
                    to={`/users/${user.username}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-xs uppercase tracking-wider font-bold text-obsidian rounded-2xl hover:bg-sand-100"
                  >
                    <Compass size={16} className="text-gold-500" />
                    <span>View Public Profile (@{user.username})</span>
                  </Link>

                  <Link
                    to="/listings/new"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-avara-600 rounded-2xl hover:bg-avara-50"
                  >
                    + Host New Destination
                  </Link>

                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-red-600 rounded-2xl hover:bg-red-50 text-left"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-center rounded-2xl border border-obsidian-200"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-center text-white bg-avara-500 rounded-2xl shadow-sm"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
