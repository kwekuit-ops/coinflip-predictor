import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CREDIT_PACKAGES } from '../config/packages';
import { isPaystackConfigured, payWithPaystack } from '../utils/paystack';

const EMAIL_STORAGE_KEY = 'predictor_checkout_email';

const CheckoutModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [email, setEmail] = React.useState(() => localStorage.getItem(EMAIL_STORAGE_KEY) || '');
  const [payStatus, setPayStatus] = React.useState({ type: '', message: '' });
  const [payingPackageId, setPayingPackageId] = React.useState(null);

  const paystackReady = isPaystackConfigured();

  // Reset status when modal closes
  const handleClose = useCallback(() => {
    setPayStatus({ type: '', message: '' });
    setPayingPackageId(null);
    onClose();
  }, [onClose]);

  const handleBuy = (pkg) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setPayStatus({ type: 'error', message: 'Enter a valid email to continue.' });
      return;
    }

    if (!paystackReady) {
      setPayStatus({
        type: 'error',
        message: 'Payment is not configured. Contact support.',
      });
      return;
    }

    localStorage.setItem(EMAIL_STORAGE_KEY, trimmedEmail);
    setPayStatus({ type: '', message: '' });
    setPayingPackageId(pkg.id);

    try {
      payWithPaystack({
        email: trimmedEmail,
        amountGhs: pkg.price,
        metadata: {
          custom_fields: [
            { display_name: 'Service Plan', variable_name: 'service_plan', value: pkg.label },
            { display_name: 'API Queries', variable_name: 'api_queries', value: String(pkg.amount) },
          ],
        },
        onSuccess: async (transaction) => {
          setPayingPackageId(null);
          try {
            const result = await onPurchaseSuccess(pkg.amount, transaction.reference);
            if (result && result.success) {
              setPayStatus({
                type: 'success',
                message: `✅ ${result.amount} tokens added to your account!`,
              });
              setTimeout(() => {
                setPayStatus({ type: '', message: '' });
                handleClose();
              }, 2500);
            } else {
              setPayStatus({
                type: 'error',
                message: (result && result.message) || 'Payment received but tokens could not be applied. Contact support.',
              });
            }
          } catch (err) {
            setPayStatus({
              type: 'error',
              message: 'Payment received. Tokens will be applied shortly.',
            });
          }
        },
        onCancel: () => {
          setPayingPackageId(null);
          setPayStatus({ type: 'error', message: 'Payment cancelled.' });
          setTimeout(() => setPayStatus({ type: '', message: '' }), 3000);
        },
      });
    } catch (err) {
      setPayingPackageId(null);
      setPayStatus({ type: 'error', message: 'Could not open payment. Please try again.' });
    }
  };

  const inputClass =
    'w-full bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={payingPackageId ? undefined : handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/8 bg-[#121216] shadow-2xl overflow-hidden"
          >
            {/* Sheet handle for mobile */}
            <div className="sm:hidden w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent shrink-0" />

            {/* Header */}
            <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5 flex items-center justify-between safe-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white tracking-tight">Get Tokens</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Paystack · GHS · Instant delivery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={!!payingPackageId}
                className="touch-target w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-500 active:bg-white/15 transition-colors disabled:opacity-30"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-4 space-y-4 sm:space-y-5">

              {/* Email input */}
              <div>
                <label htmlFor="checkout-email" className="text-[11px] font-semibold text-zinc-500 mb-2 block">
                  Email for receipt
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={`${inputClass} min-h-[44px] text-base sm:text-sm`}
                  disabled={!!payingPackageId}
                />
              </div>

              {!paystackReady && (
                <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
                  Payment gateway is not yet configured.
                </p>
              )}

              {/* Packages */}
              <div className="space-y-3">
                {CREDIT_PACKAGES.map((pkg) => {
                  const isPaying = payingPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      disabled={payingPackageId !== null}
                      onClick={() => handleBuy(pkg)}
                      className={`relative w-full min-h-[72px] p-4 rounded-2xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] sm:hover:border-blue-500/30 ${
                        pkg.popular
                          ? 'bg-blue-500/10 border-blue-500/35 ring-1 ring-blue-500/20'
                          : 'bg-white/[0.03] border-white/8'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-4 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Popular
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-2xl font-bold text-white">{pkg.amount}</span>
                            <span className="text-xs font-semibold text-blue-400">tokens</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{pkg.label} pack</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-xl font-bold text-white">₵{pkg.price}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-zinc-500 mt-1">
                            {isPaying ? (
                              <Loader2 size={11} className="animate-spin text-blue-400" />
                            ) : (
                              <CreditCard size={11} />
                            )}
                            <span className={isPaying ? 'text-blue-400' : ''}>
                              {isPaying ? 'Processing…' : 'Pay now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status message */}
              <AnimatePresence>
                {payStatus.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border ${
                      payStatus.type === 'success'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {payStatus.type === 'success'
                      ? <CheckCircle2 size={14} className="shrink-0" />
                      : <AlertCircle size={14} className="shrink-0" />
                    }
                    {payStatus.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="shrink-0 px-4 sm:px-5 py-3 pb-[max(0.75rem,var(--safe-bottom))] text-[10px] text-center text-zinc-600 border-t border-white/5">
              🔒 Secured by Paystack · Payments are encrypted
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
