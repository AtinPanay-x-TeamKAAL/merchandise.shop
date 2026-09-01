import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Printer, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Order } from '../types';

interface ETicketModalProps {
  order: Order;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({ order }) => {
  const { closeModal } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh]">
        
        {/* Top Actions Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/80">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#f472b6]" />
            <h2 className="text-sm font-bold text-white">Official E-Order Ticket Pass</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-ticket" className="overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#0b0f19]">
          
          {/* Ticket Header Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#2d1b69] to-[#131b2e] border border-[#3b2b73] p-6 text-white shadow-xl overflow-hidden">
            {/* Background watermark */}
            <div className="absolute right-0 bottom-0 text-[100px] font-black text-white/5 pointer-events-none select-none -mb-8 -mr-6 font-display">
              AP2026
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0b0f19]/60 border border-[#7c5cb7]/40 text-[10px] font-extrabold uppercase tracking-wider text-[#f472b6] mb-2">
                  <Sparkles className="w-3 h-3" />
                  Official Merchandise Pass
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  A'TIN Panay BlockScreening
                </h1>
                <p className="text-xs text-[#e0d7f5] font-medium">
                  Organized by A'TIN Panay x Team KAAL
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {order.status}
                </span>
                <div className="text-[10px] text-slate-300 mt-1 font-mono">
                  {order.paymentMethod} Verified
                </div>
              </div>
            </div>

            {/* Numbers Row */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#b19cd9]">Order Number</div>
                <div className="text-base sm:text-lg font-mono font-black text-white">
                  {order.orderNumber}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#f472b6]">Confirmation Code</div>
                <div className="text-base sm:text-lg font-mono font-black text-[#f472b6]">
                  {order.confirmationNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Claiming Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="font-bold text-[#b19cd9] uppercase tracking-wider text-[11px]">
                Passholder Information
              </div>
              <div>
                <div className="text-slate-400">Full Name:</div>
                <div className="font-bold text-white text-sm">{order.customerName}</div>
              </div>
              <div>
                <div className="text-slate-400">Email & Mobile:</div>
                <div className="font-semibold text-slate-200">{order.customerEmail} • {order.customerMobile}</div>
              </div>
              {order.customerFacebook && (
                <div>
                  <div className="text-slate-400">Facebook:</div>
                  <div className="text-slate-200">{order.customerFacebook}</div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="font-bold text-[#f472b6] uppercase tracking-wider text-[11px]">
                Claiming & Venue Details
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#f472b6] shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400">Claiming Date:</div>
                  <div className="font-bold text-white text-sm">{order.pickupDate || 'October 11, 2026'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#9381ff] shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400">Pickup Location:</div>
                  <div className="font-semibold text-slate-200">{order.pickupLocation}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Merchandise List */}
          <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#b19cd9] pb-2 border-b border-[#232f4b]">
              Itemized Claiming Summary
            </div>
            
            <div className="divide-y divide-[#232f4b]/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#1e1b4b] text-[#f472b6] font-mono font-bold flex items-center justify-center text-xs">
                      {item.quantity}x
                    </span>
                    <div>
                      <div className="font-bold text-white">{item.productTitle}</div>
                      {item.variant?.size && (
                        <div className="text-xs text-[#b19cd9]">
                          Size: <strong>{item.variant.size}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-200">
                    ₱{item.lineTotal.toLocaleString()} PHP
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#232f4b] flex justify-between items-center text-sm font-bold">
              <span className="text-slate-400">Total Amount Paid:</span>
              <span className="text-base sm:text-lg font-black text-[#f472b6]">
                ₱{order.totalAmount.toLocaleString()} PHP
              </span>
            </div>
          </div>

          {/* Visual QR & Barcode Section */}
          <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#232f4b] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <QrCode className="w-12 h-12 text-black" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Present at Claiming Desk</div>
                <div className="text-[11px] text-slate-400">
                  Scan to verify order matching <strong>{order.confirmationNumber}</strong>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">
                  Valid for 1-time claiming on October 11, 2026
                </div>
              </div>
            </div>

            {/* Visual simulated barcode */}
            <div className="space-y-1">
              <div className="font-mono text-[9px] tracking-widest text-slate-400">
                ||||| | |||| || ||| |||| | |||||
              </div>
              <div className="font-mono text-[10px] font-bold text-[#b19cd9]">
                {order.orderNumber}
              </div>
            </div>
          </div>

          {/* Ticket Footer Disclaimer */}
          <div className="text-center text-[10px] text-slate-500 leading-relaxed border-t border-[#232f4b] pt-4">
            A'TIN Panay x Team KAAL BlockScreening Merchandise Portal • Connected to APMERCH_DATABASE • Non-transferrable pass.
          </div>

        </div>

      </div>
    </div>
  );
};
