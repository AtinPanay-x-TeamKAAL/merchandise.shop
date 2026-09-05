import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Heart, ShieldCheck, Calendar, MapPin, Lock, Download } from 'lucide-react';
import { PanayEmblem, KaalLogo } from './Logos';

export const Footer: React.FC = () => {
  const { openModal, settings, isAdminLoggedIn } = useApp();

  const brandTitle = settings.headerBrandName || "A'TIN Panay";

  return (
    <footer className="bg-white border-t border-purple-100 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={brandTitle} 
                  className="w-9 h-9 rounded-full object-cover border-2 border-purple-200"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <PanayEmblem size={36} />
              )}
              {settings.teamKaalLogoUrl ? (
                <img 
                  src={settings.teamKaalLogoUrl} 
                  alt="KAAL" 
                  className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <KaalLogo size={24} />
              )}
              <div>
                <span className="font-black text-slate-900 text-base tracking-tight block">
                  {brandTitle} Community Hub
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">
                  {settings.homepageTagline || "BlockScreening Exclusive Merchandise"}
                </span>
              </div>
            </div>
            
            <p className="text-slate-600 text-xs leading-relaxed max-w-md">
              Official exclusive merchandise portal organized by <strong>{settings.organizerName || "A'TIN Panay x Team KAAL"}</strong>. Dedicated to providing premium commemorative goods, fan projects, and archival collections for SB19 fans across Panay Island and Western Visayas.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-700">
              <span className="flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 font-medium">
                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                Event: {settings.pickupDate || 'October 11, 2026'}
              </span>
              <span className="flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 font-medium">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                {settings.pickupLocation || 'Cinema Panay Screen 1 (Iloilo City)'}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Navigation & Directory
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('merchandise-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-purple-700 transition-colors"
                >
                  Featured Merchandise
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('collections-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-purple-700 transition-colors"
                >
                  Collections & Archives
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('fan-projects-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-purple-700 transition-colors"
                >
                  Fan Projects & Charity
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('team-kaal-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-purple-700 transition-colors"
                >
                  Team KAAL Library Corner
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('track-order')}
                  className="text-purple-700 hover:underline font-bold"
                >
                  Track Order Status
                </button>
              </li>
            </ul>
          </div>

          {/* Official Payments & Security */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Official Payment Support
            </h4>
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1 text-[11px] text-slate-700">
              <div className="text-purple-900 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>GCash • Maya • MariBank</span>
              </div>
              <div className="text-slate-600">Manual review & Google Sheets live synchronization</div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openModal('admin-auth')}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-purple-700 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Organizer Portal</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 {brandTitle}. All rights reserved.
          </div>
          <div className="flex items-center gap-1 font-medium">
            Made with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for SB19 & A'TIN Panay
          </div>
        </div>

      </div>
    </footer>
  );
};
