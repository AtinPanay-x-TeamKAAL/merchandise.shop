import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

export const CollectionsSection: React.FC = () => {
  const { collections, openModal } = useApp();

  return (
    <section id="collections-section" className="py-12 sm:py-16 bg-white/60 backdrop-blur-md border-t border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5 text-pink-500" />
              Archival & Drop Archives
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Exclusive Collections
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Curated themed capsules celebrating SB19 milestones and Panay fan community heritage.
            </p>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map(col => (
            <div
              key={col.id}
              className="group relative rounded-3xl bg-white/90 backdrop-blur-md border border-purple-100 hover:border-purple-300 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 border border-purple-100">
                  <img
                    src={col.coverImage}
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40" />
                  
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-extrabold text-purple-900 border border-purple-100 shadow-sm">
                      {col.status}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-bold text-white bg-slate-900/70 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/20">
                      {col.season} ({col.releaseYear})
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                    {col.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-purple-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">
                  {col.itemCount} Exclusive Items
                </span>
                <span className="text-purple-700 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Capsule <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
