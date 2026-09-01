import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    closeModal, 
    cart, 
    cartCount, 
    cartSubtotal, 
    updateCartQuantity, 
    removeFromCart, 
    openModal,
    isPreorderClosed,
    isCustomerLoggedIn
  } = useApp();

  const handleProceedCheckout = () => {
    closeModal();
    if (!isCustomerLoggedIn) {
      openModal('customer-auth', { returnToCheckout: true });
    } else {
      openModal('checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0b0f19] border-l border-[#232f4b] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-[#232f4b] flex items-center justify-between bg-[#131b2e]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1e1b4b] border border-[#3b2b73] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#f472b6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Pre-Order Bag</h2>
              <p className="text-xs text-slate-400">{cartCount} {cartCount === 1 ? 'item' : 'items'} selected</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pre-order alert badge */}
        <div className="px-5 py-2.5 bg-[#1e1b4b]/60 border-b border-[#3b2b73] text-[11px] text-[#e0d7f5] flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#f472b6] shrink-0" />
          <span>Claiming Event: <strong>October 11, 2026</strong> (Cinema Panay)</span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#131b2e] border border-[#3b2b73] flex items-center justify-center mx-auto text-[#f472b6] shadow-xl shadow-[#1e1b4b]/50">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Your Pre-Order Kalakal is Empty
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Explore our exclusive A&apos;TIN Panay merchandise and add your favorite shirts, tumblers, banners, and future fan collections.
                </p>
              </div>

              <div className="pt-3">
                <button
                  id="btn-empty-cart-browse"
                  type="button"
                  onClick={() => {
                    closeModal();
                    setTimeout(() => {
                      const merchSection = document.getElementById('merchandise-section');
                      if (merchSection) {
                        merchSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="w-full max-w-xs mx-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-lg shadow-[#7c5cb7]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#f472b6]" />
                  <span>Browse Merchandise</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.productId}-${item.selectedSize || 'nosize'}-${idx}`}
                className="p-3.5 rounded-xl bg-[#131b2e] border border-[#232f4b] flex gap-3.5 relative group"
              >
                {/* Thumbnail */}
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="w-20 h-20 rounded-lg object-cover bg-slate-900 border border-[#232f4b] shrink-0"
                />

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                      {item.product.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {item.selectedSize && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e1b4b] border border-[#3b2b73] text-[#f472b6]">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.product.color && (
                        <span className="text-[10px] text-slate-400">
                          {item.product.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm font-black text-[#b19cd9]">
                      ₱{(item.unitPrice * item.quantity).toLocaleString()}
                    </div>

                    <div className="flex items-center border border-[#232f4b] rounded-lg bg-[#0b0f19] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.selectedSize)}
                        className="px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-white min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.selectedSize)}
                        className="px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.selectedSize)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Subtotal & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#232f4b] bg-[#131b2e]/80 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-white">₱{cartSubtotal.toLocaleString()} PHP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fulfillment Type</span>
                <span className="font-semibold text-emerald-400">Event Pickup Only (Free)</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-[#232f4b]">
                <span>Total Amount Due</span>
                <span className="text-lg text-[#f472b6]">₱{cartSubtotal.toLocaleString()} PHP</span>
              </div>
            </div>

            {isPreorderClosed ? (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs text-center font-bold">
                Pre-order window closed on September 20, 2026.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProceedCheckout}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white font-bold text-sm shadow-xl shadow-[#7c5cb7]/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <p className="text-[11px] text-center text-slate-500">
              Payments accepted via GCash and MariBank with proof upload.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
