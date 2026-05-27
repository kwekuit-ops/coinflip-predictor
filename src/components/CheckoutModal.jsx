import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Loader2, CheckCircle2, AlertCircle,
  Copy, Check, Phone, Hash, ChevronLeft, ChevronRight,
  Smartphone
} from 'lucide-react';
import { CREDIT_PACKAGES } from '../config/packages';
import { supabase } from '../config/supabase';

const MOMO_NUMBER = '0542217528';
const MOMO_NAME = 'Coinflip Predictor';
const MOMO_STORAGE_KEY = 'predictor_momo_transactions';

// ── Copy to clipboard helper ──────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-[11px] font-bold transition-all active:scale-95"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ── Package card ──────────────────────────────────────────────
const PackageCard = ({ pkg, onSelect, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onSelect(pkg)}
    className={`relative w-full min-h-[72px] p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${
      pkg.popular
        ? 'bg-yellow-500/8 border-yellow-500/30 ring-1 ring-yellow-500/15'
        : 'bg-white/[0.03] border-white/8 hover:border-white/15'
    }`}
  >
    {pkg.popular && (
      <span className="absolute -top-2.5 left-4 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
        Best value
      </span>
    )}
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold text-white">{pkg.amount}</span>
          <span className="text-xs font-semibold text-yellow-400">tokens</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">{pkg.label} pack</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display text-xl font-bold text-white">₵{pkg.price}</p>
        <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-zinc-500 mt-1">
          <Smartphone size={10} />
          <span>MoMo</span>
        </div>
      </div>
    </div>
    {/* Arrow indicator */}
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
      <ChevronRight size={16} />
    </div>
  </button>
);

// ── Main modal ────────────────────────────────────────────────
const CheckoutModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [step, setStep] = useState('packages'); // 'packages' | 'pay' | 'done'
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [momoPhone, setMomoPhone] = useState('');
  const [txId, setTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const reset = useCallback(() => {
    setStep('packages');
    setSelectedPkg(null);
    setMomoPhone('');
    setTxId('');
    setSubmitting(false);
    setStatus({ type: '', message: '' });
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, reset, onClose]);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setStatus({ type: '', message: '' });
    setStep('pay');
  };

  const handleBack = () => {
    setStatus({ type: '', message: '' });
    setStep('packages');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = momoPhone.trim().replace(/\s+/g, '');
    const txRef = txId.trim().replace(/\s+/g, '');

    if (!phone || phone.length < 10) {
      setStatus({ type: 'error', message: 'Enter a valid MoMo phone number (10 digits).' });
      return;
    }
    if (!txRef || txRef.length < 3) {
      setStatus({ type: 'error', message: 'Enter the transaction ID from your MoMo SMS.' });
      return;
    }

    // Check for duplicate in localStorage
    const usedTxIds = JSON.parse(localStorage.getItem(MOMO_STORAGE_KEY) || '[]');
    if (usedTxIds.includes(txRef.toLowerCase())) {
      setStatus({ type: 'error', message: 'This transaction ID has already been used.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Check for duplicate in Supabase (if available)
      if (supabase) {
        const { data: existing } = await supabase
          .from('momo_transactions')
          .select('id')
          .eq('tx_id', txRef.toLowerCase())
          .maybeSingle();

        if (existing) {
          setStatus({ type: 'error', message: 'This transaction ID has already been used.' });
          setSubmitting(false);
          return;
        }
      }

      // Credit tokens
      const result = await onPurchaseSuccess(selectedPkg.amount, txRef);

      if (result && result.success) {
        // Save to Supabase momo_transactions
        if (supabase) {
          await supabase.from('momo_transactions').insert({
            tx_id: txRef.toLowerCase(),
            momo_phone: phone,
            amount_ghs: selectedPkg.price,
            tokens: selectedPkg.amount,
            package_label: selectedPkg.label,
          }).select();
        }

        // Save in localStorage as backup
        localStorage.setItem(MOMO_STORAGE_KEY, JSON.stringify([...usedTxIds, txRef.toLowerCase()]));

        setStep('done');
      } else {
        setStatus({
          type: 'error',
          message: (result && result.message) || 'Could not apply tokens. Please contact support.',
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-colors min-h-[48px]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md max-h-[94dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/8 bg-[#111114] shadow-2xl overflow-hidden"
          >
            {/* Mobile handle */}
            <div className="sm:hidden w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent shrink-0" />

            {/* ── STEP: PACKAGES ── */}
            {step === 'packages' && (
              <>
                {/* Header */}
                <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white tracking-tight">Get Tokens</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">MTN Mobile Money · GHS</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="touch-target w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-500 active:bg-white/15 transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-4 space-y-3">
                  <p className="text-[11px] text-zinc-500 font-medium">Select a package to continue:</p>
                  {CREDIT_PACKAGES.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
                  ))}
                </div>

                <p className="shrink-0 px-4 py-3 text-[10px] text-center text-zinc-600 border-t border-white/5">
                  🔒 Pay via MTN MoMo · Tokens credited instantly
                </p>
              </>
            )}

            {/* ── STEP: PAY ── */}
            {step === 'pay' && selectedPkg && (
              <>
                {/* Header */}
                <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-white/5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 disabled:opacity-40"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-bold text-white tracking-tight">
                      Pay ₵{selectedPkg.price} via MoMo
                    </h3>
                    <p className="text-[11px] text-zinc-500">Get {selectedPkg.amount} tokens</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-500 disabled:opacity-40"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-4 space-y-4">

                  {/* MoMo instruction card */}
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <span className="text-base">📲</span>
                      </div>
                      <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Step 1 — Send MoMo</p>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Send exactly <span className="text-white font-bold">₵{selectedPkg.price}</span> to this MTN MoMo number:
                    </p>

                    {/* MoMo number display */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                      <Phone size={15} className="text-yellow-400 shrink-0" />
                      <span className="flex-1 font-display text-xl font-black text-white tracking-wider">
                        {MOMO_NUMBER}
                      </span>
                      <CopyButton text={MOMO_NUMBER} />
                    </div>

                    <p className="text-[10px] text-zinc-500">
                      Account name: <span className="text-zinc-300 font-semibold">{MOMO_NAME}</span>
                    </p>
                  </div>

                  {/* Confirmation form */}
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-base">✅</span>
                      </div>
                      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Step 2 — Confirm Payment</p>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      After sending, enter your details below to receive your tokens instantly.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                      {/* MoMo phone */}
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 mb-1.5 block uppercase tracking-wider">
                          Your MoMo Number
                        </label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                          <input
                            type="tel"
                            inputMode="tel"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            placeholder="e.g. 0241234567"
                            className={`${inputClass} pl-9`}
                            disabled={submitting}
                            maxLength={15}
                          />
                        </div>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 mb-1.5 block uppercase tracking-wider">
                          Transaction ID (from MoMo SMS)
                        </label>
                        <div className="relative">
                          <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                          <input
                            type="text"
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            placeholder="e.g. A123456789"
                            className={`${inputClass} pl-9 uppercase`}
                            disabled={submitting}
                            maxLength={30}
                            autoCapitalize="characters"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1.5">
                          Find this in the SMS you received after sending MoMo.
                        </p>
                      </div>

                      {/* Status */}
                      <AnimatePresence>
                        {status.message && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border ${
                              status.type === 'error'
                                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            }`}
                          >
                            {status.type === 'error'
                              ? <AlertCircle size={13} className="shrink-0" />
                              : <CheckCircle2 size={13} className="shrink-0" />
                            }
                            {status.message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full min-h-[52px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-black border border-yellow-400/30 shadow-[0_8px_24px_rgba(234,179,8,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            Credit {selectedPkg.amount} Tokens
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP: DONE ── */}
            {step === 'done' && selectedPkg && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-black text-white">Tokens Added!</h3>
                  <p className="text-sm text-zinc-400">
                    <span className="text-yellow-400 font-bold">{selectedPkg.amount} tokens</span> have been credited to your account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full max-w-xs min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-white/8 border border-white/12 text-white font-bold text-sm active:scale-[0.98] transition-all"
                >
                  Start Predicting →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
