import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  User, 
  ShieldCheck, 
  Menu, 
  X, 
  Clock, 
  Sparkles,
  Layers,
  HeartHandshake,
  BookOpen,
  Info,
  LogOut,
  PackageCheck,
  Download
} from 'lucide-react';
import { PanayEmblem, KaalLogo } from './Logos';

export const Navbar: React.FC = () => {
  const { 
    cartCount, 
    openModal, 
    currentCustomer, 
    currentAdmin, 
    isCustomerLoggedIn, 
    isAdminLoggedIn, 
    logoutCustomer, 
    logoutAdmin,
    isPreorderClosed,
    timeRemaining,
    activeView,
    setActiveView
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view: any) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    
    if (view === 'merch' || view === 'shop') {
      const el = document.getElementById('merchandise-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (view === 'collections') {
      const el = document.getElementById('collections-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (view === 'fan-projects') {
      const el = document.getElementById('fan-projects-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (view === 'team-kaal' || view === 'team-kaal-corner') {
      const el = document.getElementById('team-kaal-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100/90 shadow-sm transition-all">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50/70 to-purple-50 px-4 py-1.5 text-xs text-center border-b border-purple-100 text-slate-700 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-purple-700 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          A'TIN Panay x Team KAAL
        </span>
        <span className="hidden sm:inline text-purple-200">•</span>
        <span className="text-slate-600 font-medium">
          BlockScreening Exclusive Merchandise & Fan Community Hub
        </span>
        <span className="hidden md:inline text-purple-200">•</span>
        <span className="inline-flex items-center gap-1 font-semibold text-purple-800">
          <Clock className="w-3 h-3 text-pink-500" />
          {isPreorderClosed ? (
            <span className="text-rose-600 font-bold">Pre-order Closed (Sept 20)</span>
          ) : (
            <span>Pre-order Deadline: Sept 20 ({timeRemaining.days}d {timeRemaining.hours}h left)</span>
          )}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Left */}
          <div 
            id="brand-logo"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center gap-1">
              <PanayEmblem size={42} className="group-hover:scale-105 transition-transform duration-200" />
              <div className="-ml-2.5 z-10">
                <KaalLogo size={28} className="group-hover:rotate-6 transition-transform duration-200" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors">
                  A'TIN PANAY
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  x KAAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Community Hub & Exclusive Merch
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            <button
              id="nav-home"
              onClick={() => navigateTo('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === 'home' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              Home
            </button>

            <button
              id="nav-shop"
              onClick={() => navigateTo('merch')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === 'merch' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              Shop
            </button>

            <button
              id="nav-collections"
              onClick={() => navigateTo('collections')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeView === 'collections' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              Collections
            </button>

            <button
              id="nav-fan-projects"
              onClick={() => navigateTo('fan-projects')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeView === 'fan-projects' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
              Fan Projects
            </button>

            <button
              id="nav-team-kaal"
              onClick={() => navigateTo('team-kaal-corner')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeView === 'team-kaal-corner' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              Team KAAL
            </button>

            <button
              id="nav-about"
              onClick={() => navigateTo('about')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeView === 'about' 
                  ? 'text-purple-900 bg-purple-50/90 border border-purple-200 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              About
            </button>
          </nav>

          {/* Right Side: Profile Icon, Cart Icon with Badge, plus Admin & Tracking */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download for VS Code Button */}
            <a
              id="btn-download-vscode-nav"
              href="/atin-panay-hub.zip"
              download="atin-panay-hub.zip"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              title="Download full project source code as .ZIP to open in VS Code"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>VS Code .ZIP</span>
            </a>

            {/* Quick Track Order Button */}
            <button
              id="btn-track-order-nav"
              onClick={() => openModal('track-order')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-100 transition-colors"
              title="Track Order Status"
            >
              <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Track Order</span>
            </button>

            {/* Profile Icon */}
            {isCustomerLoggedIn ? (
              <div className="relative flex items-center gap-1.5">
                <button
                  id="btn-customer-profile"
                  onClick={() => navigateTo('customer-dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    activeView === 'customer-dashboard'
                      ? 'bg-purple-600 border-purple-700 text-white shadow-md shadow-purple-500/20'
                      : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                  }`}
                  title="Customer Portal & E-Tickets"
                >
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="max-w-[100px] truncate">{currentCustomer?.fullName.split(' ')[0]}</span>
                </button>
                <button
                  id="btn-customer-logout"
                  onClick={logoutCustomer}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-profile-icon"
                onClick={() => openModal('customer-auth')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-slate-700 hover:text-purple-700 border border-purple-100 transition-all flex items-center gap-1.5"
                title="Account Profile / Sign In"
              >
                <User className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline text-xs font-bold">Sign In</span>
              </button>
            )}

            {/* Cart Icon with Item Count Badge */}
            <button
              id="btn-cart-drawer"
              onClick={() => openModal('cart')}
              className="relative p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:opacity-95 hover:scale-105 active:scale-95 transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-pink-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Entry */}
            {isAdminLoggedIn ? (
              <button
                id="btn-admin-dashboard"
                onClick={() => navigateTo('admin-dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'admin-dashboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            ) : (
              <button
                id="btn-admin-login"
                onClick={() => openModal('admin-auth')}
                className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                title="Organizer Admin Portal"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-purple-700 rounded-xl hover:bg-purple-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-purple-100 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => navigateTo('home')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold ${
              activeView === 'home' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('merch')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold ${
              activeView === 'merch' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => navigateTo('collections')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              activeView === 'collections' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-500" />
            Collections
          </button>
          <button
            onClick={() => navigateTo('fan-projects')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              activeView === 'fan-projects' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-pink-500" />
            Fan Projects
          </button>
          <button
            onClick={() => navigateTo('team-kaal-corner')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              activeView === 'team-kaal-corner' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            Team KAAL
          </button>
          <button
            onClick={() => navigateTo('about')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              activeView === 'about' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'text-slate-700'
            }`}
          >
            <Info className="w-4 h-4 text-slate-400" />
            About
          </button>

          <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-2">
            <a
              href="/atin-panay-hub.zip"
              download="atin-panay-hub.zip"
              className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>VS Code .ZIP</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('track-order');
              }}
              className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-100 text-xs font-bold text-purple-800 flex items-center gap-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Track Order</span>
            </button>

            {isCustomerLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('customer-dashboard');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>My Orders</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal('customer-auth');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
