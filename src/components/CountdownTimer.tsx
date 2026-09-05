import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

export const CountdownTimer: React.FC = () => {
  const { timeRemaining, isPreorderClosed, settings } = useApp();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-purple-100 p-6 sm:p-8 shadow-xl shadow-purple-500/5">
      {/* Soft gradient ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Info Column */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100/80 border border-purple-200 text-purple-900">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            Official Batch Timeline
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isPreorderClosed ? (
              <span className="text-rose-600">Pre-Order Period Has Ended</span>
            ) : (
              <span>Pre-Order Window is Open</span>
            )}
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {isPreorderClosed ? (
              settings.preorderClosedDescription || 'All slots for this production batch are officially sealed. Orders are now in queue for production and claiming.'
            ) : (
              settings.preorderOpenDescription || "Lock in your exclusive A'TIN Panay x Team KAAL BlockScreening merchandise before slots close on the scheduled deadline."
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 bg-purple-50/80 px-3 py-1.5 rounded-xl border border-purple-100">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span><strong>Pre-Order:</strong> {settings.preorderWindowText || (settings.preorderCloseDate ? `Open until ${settings.preorderCloseDate.split('T')[0]}` : 'Sept 1 – Sept 20, 2026')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50/80 px-3 py-1.5 rounded-xl border border-purple-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span><strong>Claiming Day:</strong> {settings.pickupDate || 'October 11, 2026'}</span>
            </div>
          </div>
        </div>

        {/* Right Countdown Digital Cards */}
        <div className="flex flex-col items-center lg:items-end gap-3">
          {isPreorderClosed ? (
            <div className="px-6 py-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center shadow-sm">
              <div className="text-base font-black tracking-wider uppercase">PRE-ORDER CLOSED</div>
              <div className="text-xs text-rose-600 mt-1">Catalog remains visible for browsing & order tracking</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Days */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-purple-50 to-white border border-purple-200 min-w-[64px] sm:min-w-[80px] shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {String(timeRemaining.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-700 mt-1">
                  Days
                </span>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-purple-50 to-white border border-purple-200 min-w-[64px] sm:min-w-[80px] shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-700 mt-1">
                  Hours
                </span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-purple-50 to-white border border-purple-200 min-w-[64px] sm:min-w-[80px] shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-700 mt-1">
                  Mins
                </span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-pink-50 to-white border border-pink-200 min-w-[64px] sm:min-w-[80px] shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-pink-600 font-mono animate-pulse">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-pink-600 mt-1">
                  Secs
                </span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Pre-order Cutoff: {settings.preorderCloseDate ? (settings.preorderCloseDate.includes('T') ? settings.preorderCloseDate.replace('T', ' ') : settings.preorderCloseDate) : 'September 20, 2026 (23:59 PHT)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
