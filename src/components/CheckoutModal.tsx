import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Copy, 
  Upload, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles,
  FileCheck,
  AlertCircle,
  QrCode,
  Eye,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, PaymentMethodConfig } from '../types';
import { INITIAL_PAYMENT_METHODS } from '../data/initialData';
import { optimizeImageFile, isImageFile } from '../utils/imageOptimizer';

export const CheckoutModal: React.FC = () => {
  const { 
    closeModal, 
    cart, 
    cartSubtotal, 
    currentCustomer, 
    settings, 
    createOrder, 
    openModal,
    addToast
  } = useApp();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState(currentCustomer?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(currentCustomer?.email || '');
  const [customerMobile, setCustomerMobile] = useState(currentCustomer?.mobileNumber || '');
  const [customerFacebook, setCustomerFacebook] = useState(currentCustomer?.facebookName || '');
  const [notes, setNotes] = useState('');

  // Dynamic Payment Methods list from settings (active only for customers)
  const availablePaymentMethods: PaymentMethodConfig[] = useMemo(() => {
    let list: any = settings?.paymentMethods;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        list = null;
      }
    }
    if (!Array.isArray(list) || list.length === 0) {
      list = INITIAL_PAYMENT_METHODS;
    }
    const filtered = list.filter((pm: any) => pm && pm.active);
    return filtered.length > 0 ? filtered : INITIAL_PAYMENT_METHODS.filter(pm => pm.active);
  }, [settings?.paymentMethods]);

  // Payment Selection
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    availablePaymentMethods[0]?.id || 'pm-gcash'
  );
  
  const currentPaymentMethod = availablePaymentMethods.find(m => m.id === selectedMethodId) || availablePaymentMethods[0] || {
    id: 'default',
    name: 'GCash',
    accountName: settings.gcashAccountName || 'Mae Joey Balla',
    accountNumber: settings.gcashNumber || '09203963249',
    qrCodeUrl: settings.gcashQrUrl,
    instructions: 'Send exact amount via GCash Express Send or scan QR code.',
    active: true
  };

  const [paymentSenderName, setPaymentSenderName] = useState(currentCustomer?.fullName || '');
  const [paymentSenderNumber, setPaymentSenderNumber] = useState(currentCustomer?.mobileNumber || '');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [enlargedQrUrl, setEnlargedQrUrl] = useState<{ url: string; title: string } | null>(null);

  // Copy account details helper
  const handleCopyAccount = (numberToCopy: string) => {
    navigator.clipboard.writeText(numberToCopy);
    setCopiedAccount(true);
    addToast('info', 'Copied to Clipboard', `Account Number ${numberToCopy} copied.`);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Image upload to base64 preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      addToast('error', 'Invalid File', 'Please upload a valid image file (JPG, PNG, WEBP, etc.).');
      return;
    }

    setProofFileName(file.name);
    try {
      const optimized = await optimizeImageFile(file, { maxDimension: 1200, quality: 0.85 });
      setPaymentProofUrl(optimized);
      addToast('success', 'Receipt Attached', 'Payment proof loaded successfully.');
    } catch (err: any) {
      console.error('Error processing receipt:', err);
      addToast('error', 'Processing Error', err.message || 'Could not process receipt image.');
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerMobile.trim()) {
      addToast('error', 'Required Fields', 'Please complete your full name, email, and mobile number.');
      return;
    }
    setStep('payment');
  };

  const handleSubmitFinalOrder = async () => {
    if (!paymentProofUrl && !paymentReferenceNumber.trim()) {
      addToast('warning', 'Payment Proof Needed', `Please attach your ${currentPaymentMethod.name} payment receipt or reference number.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await createOrder({
        customerName,
        customerEmail,
        customerMobile,
        customerFacebook,
        paymentMethod: currentPaymentMethod.name,
        paymentProofUrl,
        paymentReferenceNumber,
        paymentSenderName,
        paymentSenderNumber,
        notes
      });

      setCreatedOrder(order);
      setStep('success');

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // silent
      }
    } catch (err: any) {
      addToast('error', 'Submission Failed', err?.message || 'Could not place order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f472b6]" />
            <h2 className="text-base font-bold text-white">
              {step === 'details' && 'Step 1 of 2: Customer & Claiming Details'}
              {step === 'payment' && 'Step 2 of 2: Payment Verification'}
              {step === 'success' && 'Order Confirmed!'}
            </h2>
          </div>
          {step !== 'success' && (
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Details */}
          {step === 'details' && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              
              {/* Order Items Preview Pill */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#232f4b] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase">
                  <span>Selected Items ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                  <span className="text-[#f472b6]">Subtotal: ₱{cartSubtotal.toLocaleString()} PHP</span>
                </div>
                <div className="divide-y divide-[#232f4b]/50">
                  {cart.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#1e1b4b] text-[#e0d7f5] font-bold flex items-center justify-center text-[10px]">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-white">{item.product.title}</span>
                        {item.selectedSize && (
                          <span className="px-1.5 py-0.5 rounded bg-[#1e1b4b] text-[#f472b6] text-[10px] font-bold">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-300">
                        ₱{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup Notice */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#131b2e] border border-[#3b2b73] space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Calendar className="w-4 h-4 text-[#f472b6]" />
                  <span>Claiming Method: In-Person Pickup Only</span>
                </div>
                <p className="text-xs text-slate-300">
                  Claiming is scheduled for <strong>{settings.pickupDate || 'October 11, 2026'}</strong> at the <strong>{settings.pickupLocation || "Cinema Panay (Iloilo City)"}</strong>. Please bring your digital E-Order Ticket or valid ID.
                </p>
                
                {/* Future Delivery Notice */}
                <div className="pt-2 mt-2 border-t border-[#232f4b] flex items-center gap-2 text-[11px] text-slate-400">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nationwide Courier Delivery: <em className="text-slate-400 font-semibold">(Future Module Disabled for this Batch)</em></span>
                </div>
              </div>

              {/* Customer Contact Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#b19cd9] uppercase tracking-wider">
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Maria Clara De Los Santos"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="e.g. maria.clarisse@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mobile Number (GCash contact) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerMobile}
                      onChange={e => setCustomerMobile(e.target.value)}
                      placeholder="e.g. 09171234567"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Facebook Name / Profile Link <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customerFacebook}
                      onChange={e => setCustomerFacebook(e.target.value)}
                      placeholder="e.g. Clara Perez (A'TIN Iloilo)"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Special Notes / Inquiries <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any specific notes for the organizers..."
                    className="w-full px-3.5 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#232f4b] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-sm shadow-xl shadow-[#7c5cb7]/30 hover:opacity-95 transition-all"
                >
                  Continue to Payment Instructions →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Select Payment Method</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {availablePaymentMethods.length} option{availablePaymentMethods.length !== 1 ? 's' : ''} available
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availablePaymentMethods.map((method) => {
                    const isSelected = method.id === currentPaymentMethod.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center relative overflow-hidden group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1e1b4b] to-[#131b2e] border-[#7c5cb7] text-white shadow-lg shadow-[#7c5cb7]/25 ring-1 ring-[#7c5cb7]'
                            : 'bg-[#131b2e] border-[#232f4b] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <CreditCard className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f472b6]' : 'text-slate-500'}`} />
                          <span className={isSelected ? 'text-white' : 'text-slate-300'}>{method.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-full px-1">
                          {method.accountNumber}
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f472b6] absolute top-2 right-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Account Details & QR Code Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#131b2e] border border-[#3b2b73] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#f472b6]" />
                    <span className="font-bold text-sm text-white">
                      Official {currentPaymentMethod.name} Details
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#f472b6] bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-[#232f4b]">
                    Exact Total: ₱{cartSubtotal.toLocaleString()} PHP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0b0f19]/70 border border-[#232f4b]">
                    <div className="text-slate-400">Account / Recipient Name</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {currentPaymentMethod.accountName}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0b0f19]/70 border border-[#232f4b] flex items-center justify-between">
                    <div>
                      <div className="text-slate-400">Account / Mobile Number</div>
                      <div className="text-sm font-mono font-bold text-[#b19cd9] mt-0.5">
                        {currentPaymentMethod.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(currentPaymentMethod.accountNumber)}
                      className="p-2 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-semibold text-[#e0d7f5] flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Banner with Enlarge Lightbox */}
                {currentPaymentMethod.qrCodeUrl && (
                  <div className="p-3.5 rounded-xl bg-[#0b0f19]/80 border border-[#232f4b] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div 
                        onClick={() => setEnlargedQrUrl({ url: currentPaymentMethod.qrCodeUrl!, title: `${currentPaymentMethod.name} Payment QR` })}
                        className="relative w-16 h-16 rounded-xl bg-white p-1 shrink-0 cursor-pointer border border-[#232f4b] group shadow-md"
                        title="Click to zoom / enlarge QR code"
                      >
                        <img
                          src={currentPaymentMethod.qrCodeUrl}
                          alt={`${currentPaymentMethod.name} QR`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-[#f472b6]" />
                          <span>Scan Official QR Code</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Scan directly with your banking or e-wallet app
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEnlargedQrUrl({ url: currentPaymentMethod.qrCodeUrl!, title: `${currentPaymentMethod.name} Payment QR` })}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-bold text-[#e0d7f5] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#f472b6]" />
                      <span>Enlarge QR Code</span>
                    </button>
                  </div>
                )}

                <div className="text-[11px] text-slate-300 leading-relaxed bg-[#0b0f19]/40 p-2.5 rounded-lg border border-[#232f4b]/60">
                  💡 <strong>Instructions:</strong> {currentPaymentMethod.instructions || `Open your ${currentPaymentMethod.name} app, send exactly ₱${cartSubtotal.toLocaleString()} PHP to ${currentPaymentMethod.accountNumber} (${currentPaymentMethod.accountName}), take a screenshot of your successful transaction receipt, and upload it below.`}
                </div>
              </div>

              {/* Upload Proof & Sender Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#b19cd9] uppercase tracking-wider">
                  Upload Payment Proof
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender Name (on {currentPaymentMethod.name} app) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentSenderName}
                      onChange={e => setPaymentSenderName(e.target.value)}
                      placeholder="e.g. Maria Clara P."
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {currentPaymentMethod.name} Reference Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReferenceNumber}
                      onChange={e => setPaymentReferenceNumber(e.target.value)}
                      placeholder="e.g. 9834 7102 9471"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Proof Image Upload Area */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Payment Receipt Screenshot (JPG, PNG, WEBP) <span className="text-rose-400">*</span>
                  </label>

                  <div className="border-2 border-dashed border-[#232f4b] hover:border-[#7c5cb7] rounded-2xl p-4 bg-[#131b2e]/50 text-center transition-colors">
                    {paymentProofUrl ? (
                      <div className="space-y-3">
                        <div className="relative inline-block max-w-xs mx-auto rounded-xl overflow-hidden border border-[#7c5cb7] shadow-lg">
                          <img
                            src={paymentProofUrl}
                            alt="Payment receipt preview"
                            className="max-h-48 object-contain mx-auto bg-black"
                          />
                        </div>
                        <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receipt Attached: {proofFileName || 'receipt_screenshot.png'}</span>
                        </div>
                        <label className="inline-block px-3 py-1 rounded-lg bg-[#1e1b4b] text-slate-300 text-xs font-semibold hover:text-white cursor-pointer border border-[#3b2b73]">
                          Replace Receipt
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-4 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#1e1b4b] text-[#b19cd9] flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-white">
                          Click or drag to upload {currentPaymentMethod.name} receipt
                        </div>
                        <p className="text-[11px] text-slate-500">
                          PNG, JPG, WEBP up to 8MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#232f4b] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitFinalOrder}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white font-black text-sm shadow-xl shadow-[#7c5cb7]/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Generating Sequential Order ID...</span>
                  ) : (
                    <span>Submit Pre-Order (₱{cartSubtotal.toLocaleString()} PHP)</span>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Success Confirmation Screen */}
          {step === 'success' && createdOrder && (
            <div className="text-center py-6 space-y-6">
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  Pre-Order Submitted Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Your order has been recorded into the official <strong>APMERCH_DATABASE</strong>. An order confirmation copy has been sent to <strong>{createdOrder.customerEmail}</strong>.
                </p>
              </div>

              {/* Order Numbers Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#131b2e] border border-[#3b2b73] max-w-lg mx-auto grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Sequential Order ID</div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#b19cd9]">
                    {createdOrder.orderNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Confirmation Number</div>
                  <div className="text-base sm:text-lg font-mono font-black text-[#f472b6]">
                    {createdOrder.confirmationNumber}
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#232f4b] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {createdOrder.status}
                  </span>
                </div>
              </div>

              {/* Claiming Reminder */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#232f4b] max-w-lg mx-auto text-xs text-slate-300 flex items-start gap-3 text-left">
                <Calendar className="w-5 h-5 text-[#f472b6] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Save your claiming date:</strong>
                  <div>Claiming on <strong>October 11, 2026</strong> at Cinema Panay BlockScreening Venue. Present your E-Order Ticket upon claiming.</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    openModal('e-ticket', { order: createdOrder });
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#7c5cb7]/30 hover:opacity-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Download E-Order Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm"
                >
                  Return to Home
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ENLARGE QR CODE LIGHTBOX MODAL */}
      {enlargedQrUrl && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEnlargedQrUrl(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#0b0f19] border border-[#3b2b73] rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#f472b6]" />
                <span>{enlargedQrUrl.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedQrUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto max-w-[260px]">
              <img
                src={enlargedQrUrl.url}
                alt="QR Code Enlarge"
                className="w-full h-auto aspect-square object-contain mx-auto"
              />
            </div>

            <p className="text-xs text-slate-400">
              Scan with your mobile e-wallet or banking application.
            </p>

            <button
              type="button"
              onClick={() => setEnlargedQrUrl(null)}
              className="w-full py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-bold text-[#e0d7f5]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
