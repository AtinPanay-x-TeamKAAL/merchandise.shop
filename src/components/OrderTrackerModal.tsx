import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Search, 
  Package, 
  Calendar, 
  MapPin, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';

export const OrderTrackerModal: React.FC = () => {
  const { closeModal, searchOrderByNumber, openModal, addToast } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      addToast('error', 'Search Query Empty', 'Please enter your Order ID or Confirmation Number.');
      return;
    }

    try {
      setLoading(true);
      const res = await searchOrderByNumber(query.trim());
      setSearchedOrder(res);
      setHasSearched(true);
      if (!res) {
        addToast('warning', 'Order Not Found', `No matching order found for "${query.trim()}".`);
      }
    } catch (err: any) {
      addToast('error', 'Search Error', err?.message || 'Failed to search order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/80">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#f472b6]" />
            <h2 className="text-sm font-bold text-white">Track Order Status</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Enter Order Number (e.g. APMERCH-ORD-00001) or Confirmation Code (APMERCH-CONF-00001)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="APMERCH-ORD-00001 or APMERCH-CONF-00001"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs sm:text-sm text-white focus:border-[#7c5cb7] focus:outline-none uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-xs shadow-md hover:opacity-95 shrink-0"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </form>

          {/* Search Result Display */}
          {searchedOrder && (
            <div className="rounded-2xl bg-[#131b2e] border border-[#3b2b73] p-5 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#232f4b]">
                <div>
                  <div className="font-mono text-sm font-black text-white">
                    {searchedOrder.orderNumber}
                  </div>
                  <div className="text-xs font-mono text-[#b19cd9]">
                    Conf: {searchedOrder.confirmationNumber}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {searchedOrder.status}
                </span>
              </div>

              {/* Progress timeline */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="font-bold text-white">{searchedOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Claiming Date:</span>
                  <span className="font-semibold text-white">{searchedOrder.pickupDate}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Venue:</span>
                  <span className="text-slate-200">{searchedOrder.pickupLocation}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-[#232f4b]">
                  <span>Total Amount:</span>
                  <span className="font-black text-[#f472b6]">₱{searchedOrder.totalAmount.toLocaleString()} PHP</span>
                </div>
              </div>

              {/* Items summary */}
              <div className="p-3 rounded-xl bg-[#0b0f19]/70 border border-[#232f4b] space-y-1 text-xs">
                <div className="font-bold text-slate-300 text-[11px] uppercase">Reserved Items:</div>
                {searchedOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span>{it.quantity}x {it.productTitle} {it.variant?.size ? `(${it.variant.size})` : ''}</span>
                    <span className="font-mono">₱{it.lineTotal}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  closeModal();
                  openModal('e-ticket', { order: searchedOrder });
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>View Full E-Order Pass</span>
              </button>

            </div>
          )}

          {hasSearched && !searchedOrder && (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">No Order Found</div>
              <p className="text-xs max-w-xs mx-auto">
                Double-check your order ID or confirmation number in your confirmation email or customer dashboard.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
