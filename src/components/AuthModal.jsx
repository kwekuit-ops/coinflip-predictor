import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Lock, Eye, EyeOff, Loader2, UserCheck, LogIn } from 'lucide-react';
import { supabase } from '../config/supabase';

// ── Helpers to convert phone ↔ fake email for Supabase ────────
// Supabase requires an email address for email+password auth.
// We encode the phone number into a fake email so no SMS is needed.
const DOMAIN = 'coinflip.app';

const phoneToEmail = (phone) => {
  // Strip all non-digit chars except leading +
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/^\+/, '00');
  return `p_${cleaned}@${DOMAIN}`;
};

const emailToPhone = (email) => {
  if (!email || !email.endsWith(`@${DOMAIN}`)) return email;
  const raw = email.replace(`@${DOMAIN}`, '').replace(/^p_/, '').replace(/^00/, '+');
  return raw;
};

export { emailToPhone };

// Basic phone validation — at least 7 digits
const isValidPhone = (phone) => /^\+?[\d\s\-()]{7,15}$/.test(phone.trim());

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const switchTab = (t) => {
    setTab(t);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedPhone = phone.trim();

    if (!isValidPhone(trimmedPhone)) {
      setError('Enter a valid phone number (e.g. 0241234567 or +233241234567).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const email = phoneToEmail(trimmedPhone);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        onAuthSuccess?.(data.user);
        onClose();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (data.user) {
          onAuthSuccess?.(data.user);
          onClose();
        }
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('fetch')) {
        setError('Connection error — check your internet or try again in a moment.');
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect phone number or password.');
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('This phone number is already registered. Try signing in.');
      } else if (msg.includes('email not confirmed')) {
        setError('Account not yet active. Please contact support.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-sm flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/8 bg-[#121216] shadow-2xl overflow-hidden"
          >
            {/* Mobile handle */}
            <div className="sm:hidden w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent shrink-0" />

            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight">
                  {tab === 'login' ? 'Welcome back' : 'Create account'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {tab === 'login' ? 'Sign in with your phone & password' : 'Register with your phone number'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-500 active:bg-white/15 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="shrink-0 px-5 pt-4 flex gap-1 bg-white/[0.02]">
              {['login', 'signup'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    tab === t
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-3">
              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
                {successMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2"
                  >
                    {successMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Phone number */}
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0241234567 or +233241234567"
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  className={`${inputClass} pl-9 pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Confirm password (sign up only) */}
              <AnimatePresence>
                {tab === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`${inputClass} pl-9`}
                        required={tab === 'signup'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold border border-blue-400/30 shadow-[0_8px_24px_rgba(59,130,246,0.25)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : tab === 'login' ? (
                  <><LogIn size={15} /> Sign In</>
                ) : (
                  <><UserCheck size={15} /> Create Account</>
                )}
              </button>

              <p className="text-[10px] text-center text-zinc-600">
                📱 No SMS needed · Your tokens are securely saved in the cloud
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
