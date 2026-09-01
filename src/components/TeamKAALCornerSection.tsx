import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Sparkles, 
  User, 
  Calendar, 
  FileText, 
  ExternalLink, 
  X, 
  Heart, 
  BookmarkCheck,
  Eye
} from 'lucide-react';
import { TeamKAALItem } from '../types';
import { KaalLogo } from './Logos';

export const TeamKAALCornerSection: React.FC = () => {
  const { teamKaalItems } = useApp();
  const [selectedItem, setSelectedItem] = useState<TeamKAALItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filters = ['All', 'Stories', 'Fanfictions', 'eBooks', 'PDFs', 'Archives'];

  const filtered = teamKaalItems.filter(item => {
    if (selectedFilter === 'All') return true;
    const cat = item.category || item.type || '';
    return cat.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <section id="team-kaal-section" className="py-12 sm:py-16 bg-white/70 backdrop-blur-md border-t border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 uppercase tracking-wider mb-1">
              <KaalLogo size={18} />
              Creative Literature & Archives
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Team KAAL Library Corner
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Original fiction, creative narratives, and archival releases lovingly written by Team KAAL for A'TIN Panay.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedFilter === f
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white text-slate-700 border border-purple-100 hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group rounded-3xl bg-white/90 backdrop-blur-md border border-purple-100 hover:border-purple-300 p-5 shadow-md hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-4">
                <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-slate-100 border border-purple-100">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40" />

                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-purple-900 border border-purple-100 shadow-sm">
                      {item.category || item.type || 'Publication'}
                    </span>
                  </div>

                  {item.pageCount && (
                    <div className="absolute bottom-3 right-3">
                      <span className="text-[11px] font-bold text-white bg-slate-900/70 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/20">
                        {item.pageCount} Pages
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">
                    By {item.author} {item.publishedDate ? `• ${item.publishedDate}` : ''}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {item.synopsis || item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-purple-100 flex items-center justify-between text-xs">
                <span className="text-purple-700 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <Eye className="w-3.5 h-3.5" /> Read Synopsis
                </span>
                {(item.readUrl || item.downloadUrl) && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> PDF / Wattpad
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-purple-100 p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4">
              <img
                src={selectedItem.coverImage}
                alt={selectedItem.title}
                className="w-24 sm:w-28 h-36 sm:h-40 rounded-2xl object-cover border border-purple-100 shadow-md shrink-0"
              />
              <div className="space-y-1.5 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                  {selectedItem.category || selectedItem.type || 'Publication'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {selectedItem.title}
                </h3>
                <p className="text-xs font-semibold text-slate-600">
                  By {selectedItem.author} {selectedItem.publishedDate ? `• ${selectedItem.publishedDate}` : ''}
                </p>
                {selectedItem.pageCount && (
                  <p className="text-xs text-purple-700 font-bold">
                    Length: {selectedItem.pageCount} Pages
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis & Background</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto pr-2">
                {selectedItem.synopsis || selectedItem.description}
              </p>
            </div>

            <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              {(selectedItem.readUrl || selectedItem.downloadUrl) ? (
                <a
                  href={selectedItem.readUrl || selectedItem.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 shadow-md flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Access Story / PDF</span>
                </a>
              ) : (
                <button
                  onClick={() => alert("Story content will be released in the commemorative event pack.")}
                  className="px-5 py-2.5 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold"
                >
                  Event Exclusive Pack
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
