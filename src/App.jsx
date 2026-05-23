import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Plus, ShieldCheck, Brain, Clock, LogOut, User, CheckCircle2, AlertCircle, Info, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Coin from './components/Coin';
import PredictorPanel from './components/PredictorPanel';
import CheckoutModal from './components/CheckoutModal';
import AuthModal, { emailToPhone } from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import { playFlipSound, playWinSound, playLossSound } from './utils/sounds';
import { supabase, isSupabaseConfigured } from './config/supabase';

// ── Toast helper ──────────────────────────────────────────────
let toastId = 0;
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);
  return { toasts, addToast };
};

const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-medium shadow-2xl backdrop-blur-md pointer-events-auto ${
            t.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : t.type === 'error'
              ? 'bg-red-950/90 border-red-500/30 text-red-300'
              : 'bg-zinc-900/90 border-white/10 text-zinc-200'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />}
          {t.type === 'error' && <AlertCircle size={16} className="shrink-0 text-red-400" />}
          {t.type === 'info' && <Info size={16} className="shrink-0 text-blue-400" />}
          <span>{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Loading screen ────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="app-shell h-dvh w-full flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
      <Brain className="w-6 h-6 text-blue-400 animate-pulse" />
    </div>
    <p className="text-sm text-zinc-500 font-medium">Loading…</p>
  </div>
);

// ── Login wall (shown when not authenticated) ─────────────────
const LoginWall = ({ onOpenAuth }) => (
  <div className="app-shell h-dvh w-full flex flex-col items-center justify-center px-6 text-center gap-6">
    <div className="space-y-3">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto">
        <Brain className="w-8 h-8 text-blue-400" />
      </div>
      <h1 className="font-display text-2xl font-black text-white tracking-tight">Probability Simulation Engine</h1>
      <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
        Sign in or create an account to access the statistical modeling dashboard.
      </p>
    </div>

    <button
      type="button"
      onClick={onOpenAuth}
      className="w-full max-w-xs min-h-[52px] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-base font-bold border border-blue-400/30 shadow-[0_8px_32px_rgba(59,130,246,0.35)] active:scale-[0.98] transition-all"
    >
      <User size={18} />
      Sign In / Sign Up
    </button>

    <p className="text-[11px] text-zinc-600">
      📱 No email needed · Use your phone number
    </p>
  </div>
);

const App = () => {
  const { toasts, addToast } = useToast();

  // Auth state
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Credits
  const [credits, setCredits] = useState(0);

  const [history, setHistory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('HEAD');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [signalTime, setSignalTime] = useState('');

  // Refs to avoid stale closures
  const creditsRef = useRef(credits);
  useEffect(() => { creditsRef.current = credits; }, [credits]);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Signal time ──────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 3);
    setSignalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // ── Supabase auth listener ────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) syncCloudCredits(u);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) syncCloudCredits(u);
      else {
        setCredits(0);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sync credits from Supabase ────────────────────────────────
  const syncCloudCredits = async (u) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, is_admin, email')
      .eq('id', u.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // New user — create profile with 0 tokens (must purchase)
      const { data: inserted } = await supabase
        .from('profiles')
        .insert({ id: u.id, credits: 0, email: u.email })
        .select('credits, is_admin')
        .single();
      if (inserted) {
        setCredits(inserted.credits);
        setIsAdmin(inserted.is_admin || false);
      }
    } else if (data) {
      setCredits(data.credits);
      setIsAdmin(data.is_admin || false);
    } else if (error) {
      console.error('Fetch profile error:', error);
      addToast(`Error loading profile: ${error.message}`, 'error', 6000);
    }
    setAuthLoading(false);
  };

  const updateCloudCredits = useCallback(async (newCredits) => {
    if (!supabase || !userRef.current) return;
    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', userRef.current.id);
    if (error) console.error('Failed to sync credits:', error.message);
  }, []);

  // ── Sound helper ──────────────────────────────────────────────
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const playSoundEffect = useCallback((type) => {
    if (!soundEnabledRef.current) return;
    if (type === 'flip') playFlipSound();
    if (type === 'win') playWinSound();
    if (type === 'loss') playLossSound();
  }, []);

  // ── Paystack purchase success ─────────────────────────────────
  const handlePurchaseSuccess = useCallback(async (amount, reference) => {
    const processed = JSON.parse(localStorage.getItem('paystack_payments') || '[]');
    if (processed.includes(reference)) {
      return { success: false, message: 'This payment was already applied.' };
    }
    const newCredits = creditsRef.current + amount;
    setCredits(newCredits);
    localStorage.setItem('paystack_payments', JSON.stringify([...processed, reference]));
    await updateCloudCredits(newCredits);
    addToast(`🎉 ${amount} tokens added to your account!`, 'success', 4000);
    return { success: true, amount };
  }, [updateCloudCredits, addToast]);

  // ── Predict handlers ──────────────────────────────────────────
  const handleStartPredict = useCallback(async () => {
    if (creditsRef.current < 1) return false;
    const newCredits = creditsRef.current - 1;
    setCredits(newCredits);
    await updateCloudCredits(newCredits);
    return true;
  }, [updateCloudCredits]);

  const handlePredictionTrigger = useCallback((predictedSide) => {
    if (isSpinning) return;
    setIsSpinning(true);
    playSoundEffect('flip');

    setTimeout(() => {
      setResult(predictedSide);
      setIsSpinning(false);
      setHistory((prev) => [predictedSide, ...prev].slice(0, 10));
      playSoundEffect('win');
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#f7d358', '#60a5fa'],
      });
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + 3);
      setSignalTime(nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 3000);
  }, [isSpinning, playSoundEffect]);

  // ── Auth success ──────────────────────────────────────────────
  const handleAuthSuccess = (u) => {
    setShowAuth(false);
    const display = u?.email ? emailToPhone(u.email) : '';
    addToast(`Welcome${display ? `, ${display}` : ''}! ☁️ Tokens synced.`, 'success', 4000);
  };

  // ── Sign out ──────────────────────────────────────────────────
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setCredits(0);
    setShowAdmin(false);
    addToast('Signed out successfully.', 'info');
  };

  // ── Render states ─────────────────────────────────────────────

  // 1. Loading auth
  if (authLoading) return <LoadingScreen />;

  // 2. Not logged in — show login wall + auth modal
  if (!user) {
    return (
      <div className="app-shell h-dvh w-full text-white">
        <ToastContainer toasts={toasts} />
        <LoginWall onOpenAuth={() => setShowAuth(true)} />
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // 3. Logged in — show full app
  return (
    <div className="app-shell h-dvh w-full text-white flex flex-col overflow-hidden">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <header className="shrink-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md safe-top">
        <div className="w-full max-w-lg mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[15px] sm:text-lg font-bold tracking-tight text-white leading-tight">
                <span className="sm:hidden">Predictor</span>
                <span className="hidden sm:inline">Coinflip Predictor</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium hidden sm:block">Neural signal engine</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Credits pill */}
            <div className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-sm font-bold tabular-nums min-w-[1ch]">{credits}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-400 uppercase">tk</span>
              <button
                type="button"
                id="get-tokens-btn"
                onClick={() => setShowCheckout(true)}
                className="touch-target w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 active:bg-blue-500/40 border border-blue-500/30 flex items-center justify-center transition-colors"
                title="Get tokens"
                aria-label="Get tokens"
              >
                <Plus size={16} className="text-blue-400" />
              </button>
            </div>

            {/* Sound toggle */}
            <button
              type="button"
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled((s) => !s)}
              className={`touch-target w-11 h-11 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors ${
                soundEnabled
                  ? 'bg-blue-500/15 border-blue-500/25 text-blue-400'
                  : 'bg-white/5 border-white/8 text-zinc-500'
              }`}
              aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* Admin dashboard button */}
            {isAdmin && (
              <button
                type="button"
                id="admin-btn"
                onClick={() => setShowAdmin(true)}
                title="Admin dashboard"
                className="touch-target w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-colors"
                aria-label="Admin dashboard"
              >
                <LayoutDashboard size={16} />
              </button>
            )}

            {/* Account / sign out button */}
            <button
              type="button"
              id="sign-out-btn"
              onClick={handleSignOut}
              title={`${emailToPhone(user.email)} — tap to sign out`}
              className="touch-target w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors group"
              aria-label="Sign out"
            >
              <LogOut size={16} className="hidden group-hover:block" />
              <User size={16} className="block group-hover:hidden" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain no-scrollbar">
        <section className="relative grid-bg flex items-center justify-center px-3 py-2 sm:py-6 min-h-[28dvh] sm:min-h-[32dvh] max-h-[38dvh] sm:max-h-none">
          <div className="absolute top-0 inset-x-0 h-16 sm:h-24 bg-gradient-to-b from-[#08080a] to-transparent pointer-events-none z-10" aria-hidden />
          <Coin result={result} isSpinning={isSpinning} />
          <div className="absolute bottom-0 inset-x-0 h-20 sm:h-32 bg-gradient-to-t from-[#08080a] via-[#08080a]/90 to-transparent pointer-events-none z-10" aria-hidden />
        </section>

        <section className="px-3 sm:px-4 pb-4 safe-bottom">
          <div className="w-full max-w-md mx-auto space-y-2.5 sm:space-y-3">
            <PredictorPanel
              history={history}
              credits={credits}
              onStartPredict={handleStartPredict}
              onPredict={handlePredictionTrigger}
            />

            {/* Lucky time card */}
            <div className="glass-card rounded-xl px-3.5 py-3 sm:px-4 flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium">Next lucky window</p>
                <p className="text-sm font-bold text-white">{signalTime}</p>
              </div>
            </div>

            {/* Synced account badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-emerald-500/5 border-emerald-500/15 text-emerald-500 text-[10px] font-medium">
              <span className="truncate">☁️ Synced · {emailToPhone(user.email)}</span>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 font-medium pt-1 pb-2">
              <ShieldCheck size={11} className="text-zinc-700 shrink-0" />
              For entertainment purposes only
            </p>
          </div>
        </section>
      </main>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      <AnimatePresence>
        {showAdmin && (
          <AdminDashboard
            onClose={() => setShowAdmin(false)}
            currentUserId={user.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
