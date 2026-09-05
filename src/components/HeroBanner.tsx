import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ShoppingBag, 
  PackageCheck, 
  Calendar, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Layers,
  Heart,
  ChevronRight
} from 'lucide-react';
import { PanayEmblem, KaalLogo, Sb19WakasLogo } from './Logos';
import clothBandanaImg from '../assets/images/Cloth_Bandan_MockUp.jpg.jpg';
import lavenderHeroImg from '../assets/images/Headline_Products.jpg';
import tumblerImg from '../assets/images/Tumbler_MockUp.jpg.jpg';


export const HeroBanner: React.FC = () => {
  const { openModal, isPreorderClosed, settings, setActiveView, products } = useApp();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-6 pb-16 sm:pt-12 sm:pb-24 overflow-hidden bg-gradient-to-b from-[#faf7fd] via-[#f4edfd] to-[#fbf9fe]">
      {/* Background Concert Atmosphere Image with Soft Blur Overlay & Lavender Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Real Concert Ambient Backdrop */}
        <img
          src={lavenderHeroImg}
          alt="Lavender Concert Atmosphere"
          className="w-full h-full object-cover object-center opacity-35 filter blur-[3px] scale-105"
        />
        
        {/* Soft Lavender & Light Pink Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-[#f8f3fe]/70 to-[#faf7fd]" />
        
        {/* Glowing Luminous Orbs */}
        <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[450px] h-[450px] bg-pink-300/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Main Hero Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Small Badge: "A'TIN Panay x Team KAAL" */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-200/90 shadow-sm shadow-purple-500/5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
                A'TIN Panay x Team KAAL
              </span>
              <span className="text-purple-300 font-bold">•</span>
              <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-500" />
                Official Collaboration
              </span>
            </div>

            {/* Main Heading: Large Typography */}
            <div className="space-y-2 max-w-full overflow-hidden">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] break-words">
                {settings.homepageHeroTitle || (
                  <>
                    {settings.headerBrandName || "A'TIN Panay"}{' '}
                    <span className="block bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                      Community Hub
                    </span>
                  </>
                )}
              </h1>
              
              <div className="inline-block px-3.5 py-1 rounded-xl bg-purple-100/70 border border-purple-200/70 text-xs sm:text-sm font-bold text-purple-900 tracking-wide">
                {settings.homepageTagline || "BlockScreening Exclusive Merchandise"}
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
              {settings.homepageDescription || "Official merchandise, fan projects, collections, stories and community updates for A'TIN Panay."}
            </p>

            {/* Event Key Details - Clean Glassmorphism Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-xl bg-pink-50 text-pink-600 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Claiming Event Day</div>
                  <div className="text-sm font-extrabold text-slate-900">{settings.pickupDate || 'October 11, 2026'}</div>
                  <div className="text-[11px] text-purple-700 font-medium">Cinema Panay Screen 1</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pickup Location</div>
                  <div className="text-sm font-extrabold text-slate-900">Sm City Iloilo Cinema</div>
                  <div className="text-[11px] text-slate-500">SM City Iloilo Cinema Lobby</div>
                </div>
              </div>
            </div>

            {/* Buttons: Shop Merchandise & Explore Collections */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                id="btn-hero-shop-merchandise"
                onClick={() => scrollToSection('merchandise-section')}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-purple-600/25 hover:shadow-purple-600/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Merchandise</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-hero-explore-collections"
                onClick={() => scrollToSection('collections-section')}
                className="px-6 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-purple-900 border border-purple-200/90 font-bold text-sm sm:text-base shadow-sm hover:shadow-md hover:border-purple-300 active:scale-95 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Explore Collections</span>
              </button>

              <button
                id="btn-hero-track-order"
                onClick={() => openModal('track-order')}
                className="px-4 py-3.5 rounded-2xl bg-purple-50/80 hover:bg-purple-100/90 border border-purple-100 text-purple-800 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4 text-purple-600" />
                <span>Track Order</span>
              </button>
            </div>

            {/* Community Heritage Footnote */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Pre-Order System
              </span>
              <span>•</span>
              <span className="font-medium text-purple-700">
                100% Proceeds to Fan Projects & Logistics
              </span>
            </div>

          </div>

          {/* Right Column: Premium Showcase Card with Glassmorphism */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Glassmorphism Outer Card */}
              <div className="relative rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 p-5 sm:p-6 shadow-2xl shadow-purple-500/10 overflow-hidden group">
                
                {/* Floating Top Collaboration Badge */}
                <div className="flex items-center justify-between border-b border-purple-100 pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    {settings.logoUrl ? (
                      <img 
                        src={settings.logoUrl} 
                        alt="Emblem" 
                        className="w-7 h-7 rounded-full object-cover border border-purple-200"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <PanayEmblem size={28} />
                    )}
                    <div className="text-left">
                      <div className="text-xs font-black text-slate-900">
                        {settings.capsuleBrandName || settings.headerBrandName || "A'TIN Panay"}
                      </div>
                      <div className="text-[10px] text-purple-600 font-semibold">
                        {settings.capsuleSubtitle || "Official Merch Capsule"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[10px] font-black text-pink-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-500" />
                    {settings.capsuleBadgeText || "EXCLUSIVE BATCH"}
                  </div>
                </div>

                {/* Primary Hero Showcase Card (Lavender Shirt) */}
                <div 
                  onClick={() => {
                    const shirt = products.find(p => p.id === 'prod_shirt' || p.category === 'Apparel');
                    if (shirt) openModal('product-detail', { product: shirt });
                  }}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-100 via-pink-50 to-indigo-100 border border-purple-100 cursor-pointer group/card"
                >
                  <img
                    src={lavenderHeroImg}
                    alt="A'TIN Panay BlockScreening T-Shirt Mockup"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-purple-900 shadow-sm">
                      {settings.capsuleFlagshipBadgeText || "Flagship Drop"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <h3 className="text-base sm:text-lg font-black drop-shadow-md">
                        {settings.capsuleFeaturedTitle || "BlockScreening T-Shirt (Lavender)"}
                      </h3>
                      <p className="text-xs text-purple-200 font-medium">
                        {settings.capsuleFeaturedSubtitle || "Premium Cotton • Sizes TS to XXL"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-pink-400">
                        {settings.capsuleFeaturedPriceText || "₱550 - ₱580"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Showcase Grid (Tumbler & Cloth Banner) */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div 
                    onClick={() => {
                      const tumbler = products.find(p => p.id === 'prod_tumbler' || p.category === 'Drinkware');
                      if (tumbler) openModal('product-detail', { product: tumbler });
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <img 
                      src={tumblerImg} 
                      alt="1200ml Tumbler" 
                      className="w-10 h-10 rounded-xl object-cover bg-white shrink-0 border border-purple-200"
                    />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">1200ml Tumbler</div>
                      <div className="text-[11px] font-extrabold text-purple-700">₱750</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      const banner = products.find(p => p.id === 'prod_banner' || p.category === 'Merchandise');
                      if (banner) openModal('product-detail', { product: banner });
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <img 
                      src={clothBandanaImg}
                      alt="Cloth Banner" 
                      className="w-10 h-10 rounded-xl object-cover bg-white shrink-0 border border-purple-200"
                    />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">55cm Cloth Banner</div>
                      <div className="text-[11px] font-extrabold text-purple-700">₱150</div>
                    </div>
                  </div>
                </div>

                {/* Team KAAL Collaboration Marker */}
                <div className="mt-3.5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    {settings.teamKaalLogoUrl ? (
                      <img 
                        src={settings.teamKaalLogoUrl} 
                        alt="KAAL" 
                        className="w-5 h-5 rounded-full object-cover border border-white"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <KaalLogo size={20} />
                    )}
                    <span>{settings.capsulePartnershipText || "In partnership with Team KAAL"}</span>
                  </div>
                  <button
                    onClick={() => setActiveView('team-kaal-corner')}
                    className="text-purple-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>{settings.capsuleFanKitButtonText || "View Fan Kit"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
