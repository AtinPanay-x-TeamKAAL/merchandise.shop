import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Package, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Calendar, 
  MapPin, 
  Search, 
  RefreshCw, 
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

export const CustomerDashboard: React.FC = () => {
  const { 
    currentCustomer, 
    customerOrders, 
    refreshCustomerOrders, 
    openModal, 
    submitPaymentProof,
    addToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrderForUpload, setSelectedOrderForUpload] = useState<Order | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [senderName, setSenderName] = useState(currentCustomer?.fullName || '');
  const [senderNumber, setSenderNumber] = useState(currentCustomer?.mobileNumber || '');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending Payment':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Under Verification':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Paid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Ready For Pickup':
        return 'bg-[#7c5cb7]/30 text-[#e0d7f5] border-[#9381ff]/40';
      case 'Claimed':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProofUrl(reader.result as string);
      addToast('success', 'Receipt Attached', 'Payment proof image loaded.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProof = async () => {
    if (!selectedOrderForUpload) return;
    if (!proofUrl && !referenceNumber.trim()) {
      addToast('error', 'Missing Proof', 'Please provide a receipt screenshot or reference number.');
      return;
    }

    try {
      setIsSubmittingProof(true);
      await submitPaymentProof(
        selectedOrderForUpload.orderNumber,
        proofUrl,
        referenceNumber,
        senderName,
        senderNumber
      );
      setSelectedOrderForUpload(null);
      setProofUrl('');
      setReferenceNumber('');
      refreshCustomerOrders();
    } catch (err: any) {
      addToast('error', 'Upload Error', err?.message || 'Could not update payment proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner Profile Summary */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#131b2e] to-[#0b0f19] border border-[#3b2b73] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c5cb7] to-[#f472b6] p-[2px] shadow-lg shadow-[#7c5cb7]/30">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center text-xl font-black text-white">
              {currentCustomer?.fullName.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {currentCustomer?.fullName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Account
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {currentCustomer?.email} • {currentCustomer?.mobileNumber}
            </p>
            {currentCustomer?.facebookName && (
              <p className="text-xs text-[#b19cd9]">
                FB: {currentCustomer.facebookName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshCustomerOrders()}
            className="px-3.5 py-2 rounded-xl bg-[#131b2e] hover:bg-[#1e1b4b] border border-[#232f4b] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Sync</span>
          </button>

          <button
            onClick={() => openModal('cart')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md shadow-[#7c5cb7]/30 hover:opacity-95 flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Open Merch Bag</span>
          </button>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#b19cd9]" />
              <span>Your BlockScreening Orders</span>
            </h2>
            <p className="text-xs text-slate-400">
              Track status, verify receipts, and download official E-Order tickets
            </p>
          </div>
          <span className="text-xs font-bold text-[#f472b6] bg-[#1e1b4b] px-3 py-1 rounded-full border border-[#3b2b73]">
            {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {customerOrders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#131b2e]/40 rounded-2xl border border-[#232f4b] space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No orders yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't placed any pre-orders for the BlockScreening merchandise yet. Browse the catalog to grab your T-shirt and tumbler.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders.map(order => (
              <div
                key={order.id}
                className="rounded-2xl bg-[#131b2e] border border-[#232f4b] p-5 sm:p-6 space-y-5 hover:border-[#7c5cb7]/50 transition-colors shadow-lg"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232f4b]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-[#e0d7f5]">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="font-mono text-xs text-[#b19cd9]">
                        Conf: {order.confirmationNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Status Timeline visual */}
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                  {[
                    { label: 'Pending Payment', done: true },
                    { label: 'Under Verification', done: order.status !== 'Pending Payment' },
                    { label: 'Paid', done: ['Paid', 'Ready For Pickup', 'Claimed'].includes(order.status) },
                    { label: 'Ready For Pickup', done: ['Ready For Pickup', 'Claimed'].includes(order.status) },
                    { label: 'Claimed', done: order.status === 'Claimed' }
                  ].map((st, i) => (
                    <div key={i} className="space-y-1">
                      <div className={`h-1.5 rounded-full ${st.done ? 'bg-gradient-to-r from-[#7c5cb7] to-[#f472b6]' : 'bg-slate-800'}`} />
                      <span className={st.done ? 'text-[#e0d7f5]' : 'text-slate-600'}>
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Items List */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Order Items:
                  </div>
                  <div className="divide-y divide-[#232f4b]/60">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.imageUrl} 
                            alt={item.productTitle} 
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-[#232f4b]"
                          />
                          <div>
                            <div className="font-bold text-white">
                              {item.quantity}x {item.productTitle}
                            </div>
                            {item.variant?.size && (
                              <div className="text-xs text-[#f472b6]">
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
                </div>

                {/* Event Claiming & Total Summary */}
                <div className="p-3.5 rounded-xl bg-[#0b0f19]/70 border border-[#232f4b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                      <span>Claiming Date: <strong>{order.pickupDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-[#9381ff]" />
                      <span>{order.pickupLocation}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-xs">Total Amount: </span>
                    <span className="text-base font-black text-[#f472b6]">
                      ₱{order.totalAmount.toLocaleString()} PHP
                    </span>
                    <div className="text-[11px] text-slate-400">
                      via {order.paymentMethod}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: E-Ticket, Upload Proof */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {order.paymentStatus === 'Pending Payment' && (
                    <button
                      onClick={() => {
                        setSelectedOrderForUpload(order);
                        setSenderName(order.customerName);
                        setSenderNumber(order.customerMobile);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Payment Receipt</span>
                    </button>
                  )}

                  <button
                    onClick={() => openModal('e-ticket', { order })}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>View & Download E-Ticket</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Payment Proof Sub-Modal */}
      {selectedOrderForUpload && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <h3 className="text-sm font-bold text-white">
                Upload Payment Proof • {selectedOrderForUpload.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrderForUpload(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {selectedOrderForUpload.paymentMethod} Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g. GCASH-123456789"
                  className="w-full px-3 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Screenshot of Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1e1b4b] file:text-[#e0d7f5]"
                />
                {proofUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-[#7c5cb7] max-h-32 bg-black">
                    <img src={proofUrl} alt="Receipt" className="max-h-32 mx-auto object-contain" />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isSubmittingProof}
                onClick={handleSaveProof}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-xs shadow-md"
              >
                {isSubmittingProof ? 'Saving...' : 'Submit Payment for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
