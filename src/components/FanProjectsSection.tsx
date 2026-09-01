import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  HeartHandshake, 
  Sparkles, 
  Target, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ExternalLink,
  Heart
} from 'lucide-react';
import { FanProjectCategory } from '../types';

const PROJECT_CATEGORIES: ('All' | FanProjectCategory)[] = [
  'All',
  'Donation Drives',
  'Streaming Projects',
  'Birthday Projects',
  'Community Projects'
];

export const FanProjectsSection: React.FC = () => {
  const { fanProjects, addToast } = useApp();
  const [selectedCat, setSelectedCat] = useState<'All' | FanProjectCategory>('All');

  const filtered = fanProjects.filter(p => selectedCat === 'All' || p.category === selectedCat);

  const handleSupport = (title: string) => {
    addToast('info', 'Fan Project Contribution', `Thank you for supporting "${title}". Reach out to the organizers or use GCash to pledge.`);
  };

  return (
    <section id="fan-projects-section" className="py-12 sm:py-16 bg-white/40 backdrop-blur-md border-t border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-pink-600 uppercase tracking-wider mb-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              Panay Community Outreach
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              A'TIN Panay Fan Projects
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Charity donation drives, regional LED streaming initiatives, and grassroots community projects fueled by the love for SB19.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PROJECT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedCat === cat
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-white text-slate-700 border border-purple-100 hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(project => {
            const percentage = project.targetAmount && project.raisedAmount 
              ? Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100))
              : 100;

            return (
              <div
                key={project.id}
                className="group rounded-3xl bg-white/90 backdrop-blur-md border border-purple-100 hover:border-pink-300 p-5 space-y-4 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-purple-100">
                    <img
                      src={project.bannerImage}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-purple-900 border border-purple-100 shadow-sm">
                        {project.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                        project.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-pink-100 text-pink-800 border border-pink-200 animate-pulse'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Fund Progress if applicable */}
                  {project.targetAmount && project.raisedAmount ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Raised: <strong className="text-slate-900">₱{project.raisedAmount.toLocaleString()}</strong></span>
                        <span className="text-pink-600 font-extrabold">{percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        Target: ₱{project.targetAmount.toLocaleString()}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>{project.organizer}</span>
                  </div>

                  <button
                    onClick={() => handleSupport(project.title)}
                    className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    <span>Support</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
