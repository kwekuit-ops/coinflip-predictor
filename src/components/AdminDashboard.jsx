import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Zap, RefreshCw, Shield, ShieldOff,
  Edit3, Check, ChevronLeft, AlertCircle, Loader2,
  TrendingUp, Coins
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

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

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

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' });
  };

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
          onClick={() => fetchProfiles(true)}
          disabled={refreshing}
          className="touch-target w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
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

        {/* Users list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Loading users…</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-600">
            <Users size={28} />
            <p className="text-sm">No users yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-1">All Users</p>
            {profiles.map((profile) => {
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
    </motion.div>
  );
};

export default AdminDashboard;
