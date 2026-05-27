import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Zap, RefreshCw, Shield, ShieldOff,
  Edit3, Check, ChevronLeft, AlertCircle, Loader2,
  TrendingUp, Coins, CheckCircle2, Search
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { emailToPhone } from './AuthModal';

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${colors[color]}`}>
      <div className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black font-display leading-tight">{value}</p>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onClose, currentUserId }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for transactions tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'transactions'
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [processingTxId, setProcessingTxId] = useState(null);

  const fetchProfiles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_all_profiles');
      if (rpcErr) throw rpcErr;
      setProfiles(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const { data, error: txErr } = await supabase
        .from('momo_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (txErr) throw txErr;
      setTransactions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    if (activeTab === 'users') fetchProfiles(); 
    else fetchTransactions();
  }, [activeTab, fetchProfiles, fetchTransactions]);

  const handleRefresh = () => {
    if (activeTab === 'users') fetchProfiles(true);
    else fetchTransactions(true);
  };

  const totalTokens = profiles.reduce((sum, p) => sum + (p.credits || 0), 0);

  const handleSaveCredits = async (profileId) => {
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_set_credits', {
        target_id: profileId,
        new_credits: parsed,
      });
      if (rpcErr) throw rpcErr;
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, credits: parsed } : p))
      );
      setEditingId(null);
    } catch (err) {
      alert('Failed to update credits: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (profileId) => {
    setTogglingId(profileId);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_toggle_admin', {
        target_id: profileId,
      });
      if (rpcErr) throw rpcErr;
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_admin: !p.is_admin } : p))
      );
    } catch (err) {
      alert('Failed to toggle admin: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTransactionAction = async (txId, action) => {
    setProcessingTxId(txId);
    try {
      if (action === 'approve') {
        const { error: rpcErr } = await supabase.rpc('admin_approve_momo', { target_tx_id: txId });
        if (rpcErr) throw rpcErr;
      } else {
        const { error: updateErr } = await supabase
          .from('momo_transactions')
          .update({ status: 'rejected' })
          .eq('id', txId);
        if (updateErr) throw updateErr;
      }
      
      // Remove from list
      setTransactions(prev => prev.filter(t => t.id !== txId));
      
      // If approved, refresh profiles so the new tokens show up in stats
      if (action === 'approve') fetchProfiles(true);
      
    } catch (err) {
      alert(`Failed to ${action} transaction: ${err.message}`);
    } finally {
      setProcessingTxId(null);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const phone = p.email ? emailToPhone(p.email).toLowerCase() : p.id.toLowerCase();
    return phone.includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-[#08080a] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md px-4 py-3 safe-top flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base font-bold text-white">Admin Dashboard</h2>
          <p className="text-[10px] text-zinc-500">{profiles.length} registered users</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-4 pt-3 flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${
            activeTab === 'users' 
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
              : 'bg-white/5 text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-colors relative ${
            activeTab === 'transactions' 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
              : 'bg-white/5 text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          Transactions
          {transactions.length > 0 && activeTab === 'users' && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#08080a]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Users} label="Total Users" value={profiles.length} color="blue" />
          <StatCard icon={Coins} label="Tokens in Use" value={totalTokens} color="amber" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lists */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Loading…</p>
          </div>
        )}
        
        {!loading && activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-600">
                <Users size={28} />
                <p className="text-sm">No users yet</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-600">
                <Search size={28} />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-1">
                  {searchQuery ? `Search Results (${filteredProfiles.length})` : 'All Users'}
                </p>

                {filteredProfiles.map((profile) => {
              const phone = profile.email ? emailToPhone(profile.email) : profile.id.slice(0, 8) + '…';
              const isEditing = editingId === profile.id;
              const isMe = profile.id === currentUserId;

              return (
                <motion.div
                  key={profile.id}
                  layout
                  className={`rounded-2xl border p-3.5 space-y-2.5 ${
                    profile.is_admin
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-white/[0.03] border-white/8'
                  }`}
                >
                  {/* User info row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-white font-display truncate">
                          {phone}
                        </span>
                        {profile.is_admin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
                            Admin
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Last active: {formatDate(profile.updated_at)}
                      </p>
                    </div>

                    {/* Toggle admin */}
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleToggleAdmin(profile.id)}
                        disabled={togglingId === profile.id}
                        className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                          profile.is_admin
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                            : 'bg-white/5 border-white/10 text-zinc-600 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400'
                        }`}
                        title={profile.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        {togglingId === profile.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : profile.is_admin ? <ShieldOff size={13} /> : <Shield size={13} />
                        }
                      </button>
                    )}
                  </div>

                  {/* Credits row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2 border border-white/5">
                      <Zap size={12} className="text-blue-400 shrink-0" />
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-transparent text-sm font-bold text-white outline-none min-w-0"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCredits(profile.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className="flex-1 text-sm font-bold text-white tabular-nums">
                          {profile.credits} tokens
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveCredits(profile.id)}
                          disabled={saving}
                          className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition-colors"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingId(profile.id); setEditValue(String(profile.credits)); }}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                        title="Edit tokens"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
              </div>
            )}
          </div>
        )}
        {!loading && activeTab === 'transactions' && (
          transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-600">
              <CheckCircle2 size={28} className="text-zinc-700" />
              <p className="text-sm">No pending transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-1">Pending Approval</p>
              {transactions.map((tx) => {
                const isProcessing = processingTxId === tx.id;
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    className="rounded-2xl border bg-amber-500/5 border-amber-500/20 p-3.5 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-display">{tx.momo_phone}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-400 font-mono">
                            {tx.tx_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {formatDate(tx.created_at)} • User: {tx.user_id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-400">₵{tx.amount_ghs}</p>
                        <p className="text-[10px] font-bold text-zinc-400">+{tx.tokens} tokens</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleTransactionAction(tx.id, 'reject')}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleTransactionAction(tx.id, 'approve')}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isProcessing && <Loader2 size={12} className="animate-spin" />}
                        Approve
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
