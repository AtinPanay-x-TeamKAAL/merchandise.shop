import React from 'react';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface LockInModalProps {
  isOpen: boolean;
  title: string;
  itemType: string;
  isSaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LockInModal: React.FC<LockInModalProps> = ({
  isOpen,
  title,
  itemType,
  isSaving,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#3b2b73] rounded-2xl shadow-2xl p-6 space-y-5 text-left">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c5cb7] to-[#9381ff] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#7c5cb7]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Save & Lock In Changes
            </h3>
            <p className="text-xs text-[#b19cd9] font-medium mt-0.5">
              {itemType}: <strong className="text-white">{title}</strong>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#232f4b] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Persistent Database Lock Guarantee</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Locking in this update saves your uploaded photo and settings into <strong>APMERCH_DATABASE</strong> and persistent cloud/local storage.
          </p>
          <p className="text-emerald-400 font-semibold text-[11px]">
            ✓ It will NOT revert to the default preset image upon restart or reload.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#7c5cb7]/30 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking in...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Lock In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
