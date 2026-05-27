import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogOut, Clock, CheckCircle2, XCircle, Coins, Loader2, ChevronLeft, KeyRound } from 'lucide-react';
import { supabase } from '../config/supabase';
import { emailToPhone } from './AuthModal';

const UserProfileModal = ({ isOpen, onClose, user, credits, onSignOut }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('momo_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setUpdatingPassword(true);
    setPasswordStatus({ type: '', message: '' });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase"><CheckCircle2 size={10} /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase"><XCircle size={10} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase"><Clock size={10} /> Pending</span>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[200] max-h-[85vh] bg-[#0c0c0f] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full sm:rounded-3xl sm:border"
          >
            {/* Header */}
            <div className="shrink-0 flex justify-between items-center px-5 py-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Your Profile</h3>
                  <p className="text-xs text-zinc-400">{user ? emailToPhone(user.email) : ''}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              
              {/* Token Balance */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Available Balance</p>
                    <p className="text-xl font-display font-bold text-white leading-tight">{credits} <span className="text-sm font-semibold text-blue-400">Tokens</span></p>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Recent Transactions</h4>
                
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <p className="text-sm text-zinc-500">No recent transactions.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(tx => (
                      <div key={tx.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">+{tx.tokens} tokens</span>
                            <StatusBadge status={tx.status} />
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono">{tx.tx_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-yellow-400">₵{tx.amount_ghs}</p>
                          <p className="text-[9px] text-zinc-600 mt-0.5">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security / Change Password */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Security</h4>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <KeyRound className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-300">Change Password</span>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {showPasswordChange && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        <div className="pt-2 space-y-3">
                          <input
                            type="password"
                            placeholder="New password (min 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                          />
                          {passwordStatus.message && (
                            <p className={`text-[11px] ${passwordStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {passwordStatus.message}
                            </p>
                          )}
                          <button
                            onClick={handleUpdatePassword}
                            disabled={updatingPassword}
                            className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            {updatingPassword ? <Loader2 size={14} className="animate-spin" /> : 'Save New Password'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer / Sign out */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-white/5 bg-black/20">
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-400 font-bold active:bg-red-500/20 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
