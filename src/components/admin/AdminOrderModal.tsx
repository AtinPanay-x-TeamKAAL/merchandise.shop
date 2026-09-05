import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  User, 
  CreditCard, 
  Calendar, 
  MapPin, 
  FileText,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Order, OrderItem, Product, ProductSize, OrderStatus, PaymentStatus, PaymentMethodConfig } from '../../types';
import { ImageUploadField } from '../ImageUploadField';

interface AdminOrderModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  order?: Order | null;
  products: Product[];
  paymentMethods: PaymentMethodConfig[];
  defaultPickupDate: string;
  defaultPickupLocation: string;
  onSave: (orderData: any) => Promise<void>;
  onClose: () => void;
}

export const AdminOrderModal: React.FC<AdminOrderModalProps> = ({
  isOpen,
  mode,
  order,
  products,
  paymentMethods,
  defaultPickupDate,
  defaultPickupLocation,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  // Customer Form State
  const [customerName, setCustomerName] = useState(order?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(order?.customerEmail || '');
  const [customerMobile, setCustomerMobile] = useState(order?.customerMobile || '');
  const [customerFacebook, setCustomerFacebook] = useState(order?.customerFacebook || '');

  // Order Items State
  const [items, setItems] = useState<OrderItem[]>(() => {
    if (order?.items && order.items.length > 0) {
      return JSON.parse(JSON.stringify(order.items));
    }
    if (products.length > 0) {
      const firstProd = products[0];
      return [{
        id: `ITEM-${Date.now()}-1`,
        productId: firstProd.id,
        productTitle: firstProd.title,
        productCategory: firstProd.category,
        variant: { size: 'M' as ProductSize, color: firstProd.color || 'Lavender' },
        unitPrice: firstProd.basePrice || firstProd.price || 550,
        quantity: 1,
        lineTotal: firstProd.basePrice || firstProd.price || 550,
        imageUrl: firstProd.imageUrl || ''
      }];
    }
    return [];
  });

  // Payment & Fulfillment State
  const [paymentMethod, setPaymentMethod] = useState(order?.paymentMethod || (paymentMethods[0]?.name || 'GCash'));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order?.paymentStatus || 'Paid');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order?.status || 'Paid');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState(order?.paymentReferenceNumber || '');
  const [paymentSenderName, setPaymentSenderName] = useState(order?.paymentSenderName || '');
  const [paymentSenderNumber, setPaymentSenderNumber] = useState(order?.paymentSenderNumber || '');
  const [paymentProofUrl, setPaymentProofUrl] = useState(order?.paymentProofUrl || '');
  const [pickupDate, setPickupDate] = useState(order?.pickupDate || defaultPickupDate || 'October 11, 2026');
  const [pickupLocation, setPickupLocation] = useState(order?.pickupLocation || defaultPickupLocation || 'Cinema Panay Screen 1 Lobby (SM City Iloilo)');
  const [notes, setNotes] = useState(order?.notes || '');
  const [customTotal, setCustomTotal] = useState<number | ''>(order ? order.totalAmount : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when order prop changes
  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || '');
      setCustomerEmail(order.customerEmail || '');
      setCustomerMobile(order.customerMobile || '');
      setCustomerFacebook(order.customerFacebook || '');
      setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
      setPaymentMethod(order.paymentMethod || 'GCash');
      setPaymentStatus(order.paymentStatus || 'Paid');
      setOrderStatus(order.status || 'Paid');
      setPaymentReferenceNumber(order.paymentReferenceNumber || '');
      setPaymentSenderName(order.paymentSenderName || order.customerName || '');
      setPaymentSenderNumber(order.paymentSenderNumber || order.customerMobile || '');
      setPaymentProofUrl(order.paymentProofUrl || '');
      setPickupDate(order.pickupDate || defaultPickupDate);
      setPickupLocation(order.pickupLocation || defaultPickupLocation);
      setNotes(order.notes || '');
      setCustomTotal(order.totalAmount);
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerMobile('');
      setCustomerFacebook('');
      setPaymentReferenceNumber(`MANUAL-${Date.now().toString(36).toUpperCase()}`);
      setPaymentStatus('Paid');
      setOrderStatus('Paid');
      setPaymentProofUrl('');
      setNotes('Admin manual walk-in / direct order');
      setPickupDate(defaultPickupDate || 'October 11, 2026');
      setPickupLocation(defaultPickupLocation || 'Cinema Panay Screen 1 Lobby (SM City Iloilo)');
      if (products.length > 0) {
        const firstProd = products[0];
        setItems([{
          id: `ITEM-${Date.now()}-1`,
          productId: firstProd.id,
          productTitle: firstProd.title,
          productCategory: firstProd.category,
          variant: { size: 'M' as ProductSize, color: firstProd.color || 'Lavender' },
          unitPrice: firstProd.basePrice || firstProd.price || 550,
          quantity: 1,
          lineTotal: firstProd.basePrice || firstProd.price || 550,
          imageUrl: firstProd.imageUrl || ''
        }]);
      }
    }
  }, [order, isOpen]);

  // Calculate items sum
  const calculatedItemsTotal = items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice * item.quantity)), 0);
  const finalTotal = typeof customTotal === 'number' && customTotal >= 0 ? customTotal : calculatedItemsTotal;

  // Handle Item Changes
  const handleProductChange = (index: number, newProductId: string) => {
    const selectedProd = products.find(p => p.id === newProductId);
    if (!selectedProd) return;

    setItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      const size = currentItem.variant?.size || 'M';
      let unitPrice = selectedProd.basePrice || selectedProd.price;
      if (size === 'XXL' && selectedProd.xxlPrice) {
        unitPrice = selectedProd.xxlPrice;
      }

      updated[index] = {
        ...currentItem,
        productId: selectedProd.id,
        productTitle: selectedProd.title,
        productCategory: selectedProd.category,
        variant: { size, color: selectedProd.color || 'Lavender' },
        unitPrice,
        lineTotal: unitPrice * currentItem.quantity,
        imageUrl: selectedProd.imageUrl || ''
      };
      return updated;
    });
  };

  const handleSizeChange = (index: number, newSize: ProductSize) => {
    setItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      const selectedProd = products.find(p => p.id === currentItem.productId);
      let unitPrice = currentItem.unitPrice;

      if (selectedProd) {
        unitPrice = selectedProd.basePrice || selectedProd.price;
        if (newSize === 'XXL' && selectedProd.xxlPrice) {
          unitPrice = selectedProd.xxlPrice;
        }
      }

      updated[index] = {
        ...currentItem,
        variant: { ...currentItem.variant, size: newSize },
        unitPrice,
        lineTotal: unitPrice * currentItem.quantity
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty || 1);
    setItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      updated[index] = {
        ...currentItem,
        quantity: qty,
        lineTotal: currentItem.unitPrice * qty
      };
      return updated;
    });
  };

  const handleUnitPriceChange = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice || 0);
    setItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      updated[index] = {
        ...currentItem,
        unitPrice: price,
        lineTotal: price * currentItem.quantity
      };
      return updated;
    });
  };

  const handleAddItem = () => {
    const prod = products[0];
    if (!prod) return;
    const newItem: OrderItem = {
      id: `ITEM-${Date.now()}-${items.length + 1}`,
      productId: prod.id,
      productTitle: prod.title,
      productCategory: prod.category,
      variant: { size: 'M' as ProductSize, color: prod.color || 'Lavender' },
      unitPrice: prod.basePrice || prod.price || 550,
      quantity: 1,
      lineTotal: prod.basePrice || prod.price || 550,
      imageUrl: prod.imageUrl || ''
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('An order must have at least one merchandise item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Order> = {
        ...(order || {}),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || 'walkin@atinpanay.com',
        customerMobile: customerMobile.trim() || 'N/A',
        customerFacebook: customerFacebook.trim(),
        items,
        subtotal: calculatedItemsTotal,
        totalAmount: finalTotal,
        paymentMethod,
        paymentStatus,
        status: orderStatus,
        paymentReferenceNumber: paymentReferenceNumber.trim() || 'N/A',
        paymentSenderName: paymentSenderName.trim() || customerName.trim(),
        paymentSenderNumber: paymentSenderNumber.trim() || customerMobile.trim(),
        paymentProofUrl: paymentProofUrl.trim(),
        pickupDate: pickupDate.trim() || defaultPickupDate,
        pickupLocation: pickupLocation.trim() || defaultPickupLocation,
        deliveryMethod: 'Pickup Only',
        notes: notes.trim()
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving order:', err);
      alert(err.message || 'Failed to save order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSizes: ProductSize[] = ['TS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-[#232f4b] rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c5cb7] to-[#f472b6] flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'edit' ? `Edit Order • ${order?.orderNumber}` : 'Create Manual Order'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'edit' ? 'Modify customer details, items, quantities, and verification status' : 'Add a direct walk-in, offline, or custom pre-order'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* SECTION 1: Customer Information */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-[#b19cd9]">
              <User className="w-4 h-4 text-[#f472b6]" />
              <span>Customer Details</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="juan@example.com"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile / Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value)}
                  placeholder="09171234567"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Facebook / Social Handle (Optional)</label>
                <input
                  type="text"
                  value={customerFacebook}
                  onChange={e => setCustomerFacebook(e.target.value)}
                  placeholder="fb.com/juan.delacruz or @juan"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Items & Sizing Editor */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-[#b19cd9]">
                <ShoppingBag className="w-4 h-4 text-[#f472b6]" />
                <span>Merchandise Items ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-[#e0d7f5] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-pink-400" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div key={it.id || idx} className="p-3 rounded-xl bg-[#0b0f19] border border-[#232f4b] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  
                  {/* Product Selector */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Product</label>
                    <select
                      value={it.productId}
                      onChange={e => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#131b2e] border border-[#232f4b] rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#7c5cb7]"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Selector */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Size</label>
                    <select
                      value={it.variant?.size || 'M'}
                      onChange={e => handleSizeChange(idx, e.target.value as ProductSize)}
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#232f4b] rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#7c5cb7]"
                    >
                      {availableSizes.map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={e => handleQuantityChange(idx, parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#232f4b] rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Unit ₱</label>
                    <input
                      type="number"
                      min="0"
                      value={it.unitPrice}
                      onChange={e => handleUnitPriceChange(idx, parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#232f4b] rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>

                  {/* Subtotal & Delete Action */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-4">
                    <div className="font-mono font-bold text-[#f472b6]">
                      ₱{((it.unitPrice || 0) * (it.quantity || 1)).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount Summary */}
            <div className="pt-3 border-t border-[#232f4b] flex flex-wrap items-center justify-between gap-3">
              <div className="text-slate-400 text-xs">
                Items Total: <span className="font-mono font-bold text-white">₱{calculatedItemsTotal.toLocaleString()} PHP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-semibold">Total Amount (PHP):</span>
                <input
                  type="number"
                  value={customTotal}
                  onChange={e => setCustomTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder={String(calculatedItemsTotal)}
                  className="w-28 px-3 py-1.5 bg-[#0b0f19] border border-[#7c5cb7] rounded-xl text-white font-mono font-black text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Payment & Verification Status */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-[#b19cd9]">
              <CreditCard className="w-4 h-4 text-[#f472b6]" />
              <span>Payment & Verification Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                >
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                  ))}
                  <option value="Cash / Walk-in">Cash / Walk-in</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                >
                  <option value="Paid">Paid (Verified)</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={e => setOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                >
                  <option value="Paid">Paid (Confirmed)</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Ready For Pickup">Ready For Pickup</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Reference Number</label>
                <input
                  type="text"
                  value={paymentReferenceNumber}
                  onChange={e => setPaymentReferenceNumber(e.target.value)}
                  placeholder="e.g. 100234857291"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Sender Name on Receipt</label>
                <input
                  type="text"
                  value={paymentSenderName}
                  onChange={e => setPaymentSenderName(e.target.value)}
                  placeholder="Sender name"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>

            {/* Receipt Proof URL */}
            <div className="pt-2">
              <ImageUploadField
                label="Payment Receipt / Proof Screenshot URL"
                value={paymentProofUrl}
                onChange={setPaymentProofUrl}
                folder="Payment_Qr"
                placeholder="https://... or upload screenshot"
                helpText="Proof screenshot for audit and payment verification"
              />
            </div>
          </div>

          {/* SECTION 4: Claiming & Notes */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-[#b19cd9]">
              <Calendar className="w-4 h-4 text-[#f472b6]" />
              <span>Event Claiming & Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Claiming Date</label>
                <input
                  type="text"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  placeholder="October 11, 2026"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pickup Venue & Booth</label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="Cinema Panay Screen 1 Lobby"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Admin Notes / Special Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special instructions, companion ticket, bulk order notes..."
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#232f4b] flex items-center justify-between">
            <div className="text-slate-400 text-xs">
              {mode === 'edit' ? 'Modifications will update the order tracking system and Google Sheets.' : 'Order will be generated with a sequential Order Number and Confirmation Code.'}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#f472b6] text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Order Changes' : 'Create Order'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
