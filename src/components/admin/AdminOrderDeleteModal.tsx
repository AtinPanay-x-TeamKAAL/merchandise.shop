import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Order } from '../../types';

interface AdminOrderDeleteModalProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const AdminOrderDeleteModal: React.FC<AdminOrderDeleteModalProps> = ({
  isOpen,
  order,
  onConfirm,
  onClose
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !order) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Delete order error:', err);
      alert(err.message || 'Failed to delete order.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-rose-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">Delete Order?</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete order <strong className="text-white font-mono">{order.orderNumber}</strong>?
        </p>

        <div className="p-3.5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Customer:</span>
            <span className="font-bold text-white">{order.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Confirmation:</span>
            <span className="font-mono text-purple-300">{order.confirmationNumber}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Items:</span>
            <span className="text-slate-200">{order.items?.length || 0} items</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Total:</span>
            <span className="font-mono font-bold text-emerald-400">₱{order.totalAmount?.toLocaleString()} PHP</span>
          </div>
        </div>

        <p className="text-[11px] text-rose-400/90 font-medium">
          ⚠️ This action will remove the record from memory and synchronize with the APMERCH_DATABASE Orders sheet.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
