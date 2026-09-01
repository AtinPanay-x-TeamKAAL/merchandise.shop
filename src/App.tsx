import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { CountdownTimer } from './components/CountdownTimer';
import { HeroBanner } from './components/HeroBanner';
import { FeaturedMerchandise } from './components/FeaturedMerchandise';
import { CollectionsSection } from './components/CollectionsSection';
import { FanProjectsSection } from './components/FanProjectsSection';
import { TeamKAALCornerSection } from './components/TeamKAALCornerSection';
import { Footer } from './components/Footer';

// Modals
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ETicketModal } from './components/ETicketModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';

// Lucide Toast icons
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    activeView, 
    activeModal, 
    modalData, 
    closeModal,
    toasts, 
    removeToast,
    isAdminLoggedIn,
    isCustomerLoggedIn
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fd] text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* Clean White Top Navbar */}
      <Navbar />

      {/* Main Body Content based on active view */}
      <main className="flex-grow">
        {(activeView === 'admin' || activeView === 'admin-dashboard') && isAdminLoggedIn ? (
          <AdminDashboard />
        ) : activeView === 'customer-dashboard' && isCustomerLoggedIn ? (
          <CustomerDashboard />
        ) : (
          <div>
            {/* Redesigned Homepage Hero Section */}
            <HeroBanner />
            
            {/* Content Sections Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
              <CountdownTimer />
              <FeaturedMerchandise />
              <CollectionsSection />
              <FanProjectsSection />
              <TeamKAALCornerSection />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals Manager */}
      {activeModal === 'product-detail' && modalData?.product && (
        <ProductDetailModal 
          product={modalData.product} 
          initialSize={modalData.initialSize} 
          viewSizeChartDefault={modalData.viewSizeChart}
        />
      )}

      {activeModal === 'cart' && <CartDrawer />}

      {activeModal === 'checkout' && <CheckoutModal />}

      {activeModal === 'customer-auth' && (
        <CustomerAuthModal 
          initialTab={modalData?.initialTab || 'login'} 
          returnToCheckout={modalData?.returnToCheckout}
        />
      )}

      {activeModal === 'admin-auth' && <AdminAuthModal />}

      {activeModal === 'e-ticket' && modalData?.order && (
        <ETicketModal order={modalData.order} />
      )}

      {(activeModal === 'track-order' || activeModal === 'order-tracker') && <OrderTrackerModal />}

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-purple-900 text-white border-purple-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />}

            <div className="flex-1 space-y-0.5">
              <div className="text-xs font-bold leading-tight">{toast.title}</div>
              <div className="text-[11px] opacity-90 leading-relaxed">{toast.message}</div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
