import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Mail, X, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const { closeModal, loginAdmin, addToast } = useApp();
  const [email, setEmail] = useState('yeojeam@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('error', 'Email Required', 'Please enter your authorized admin email address.');
      return;
    }

    try {
      setLoading(true);
      await loginAdmin(email.trim(), password.trim());
      closeModal();
    } catch (err: any) {
      addToast('error', 'Admin Access Denied', err?.message || 'Unauthorized admin email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7c5cb7]/30 border border-[#7c5cb7]/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#f472b6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Admin Command Center Sign In</h2>
              <p className="text-[11px] text-slate-400">Restricted to A'TIN Panay Organizers</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-[#1e1b4b]/50 border border-[#3b2b73] text-xs text-slate-300">
            Authorized Email: <strong className="text-[#f472b6]">yeojeam@gmail.com</strong> (Pre-configured Super Admin)
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yeojeam@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password / Access Key <span className="text-slate-500">(Optional for primary email)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin PIN or Passcode"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white font-bold text-sm shadow-xl shadow-[#7c5cb7]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
