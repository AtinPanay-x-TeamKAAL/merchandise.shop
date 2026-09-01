import React from 'react';

/**
 * High-fidelity SVG Logos for A'TIN Panay, Team KAAL, and SB19 Wakas at Simula
 */

export const PanayEmblem: React.FC<{ className?: string; size?: number; light?: boolean }> = ({ 
  className = "w-10 h-10", 
  size = 40,
  light = false 
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="panayGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c5cb7" />
            <stop offset="50%" stopColor="#9381ff" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7c5cb7" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Outer Circular Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="92" 
          stroke={light ? "#ffffff" : "url(#panayGrad)"} 
          strokeWidth="6" 
          strokeLinecap="round"
          className="opacity-90"
        />

        {/* Outer Crescent Arc */}
        <path 
          d="M 28,100 A 72,72 0 1,1 172,100" 
          stroke={light ? "#e0d7f5" : "#7c5cb7"} 
          strokeWidth="3" 
          strokeDasharray="4 6"
          fill="none" 
          className="opacity-75"
        />

        {/* Baybayin-Inspired Glyph Ring Coordinates */}
        <g stroke={light ? "#ffffff" : "#6b46c1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="opacity-90">
          {/* Top Glyphs: A-T-I-N */}
          <path d="M 90,30 Q 100,22 110,30 T 100,42" />
          <path d="M 65,42 Q 72,35 80,45" />
          <path d="M 120,42 Q 128,35 135,45" />
          
          {/* Side Glyphs: PA-NA-Y */}
          <path d="M 32,80 Q 42,85 36,95" />
          <path d="M 32,110 Q 40,115 35,125" />
          <path d="M 165,80 Q 155,85 160,95" />
          <path d="M 165,110 Q 158,115 162,125" />
          
          {/* Bottom Arc Glyphs */}
          <path d="M 65,155 Q 75,165 85,158" />
          <path d="M 95,168 Q 100,175 105,168" />
          <path d="M 115,158 Q 125,165 135,155" />
        </g>

        {/* Center Diamond / AP Monogram */}
        <g id="ap-monogram" filter="url(#softGlow)">
          {/* Left Arrow Diamond Half (A) */}
          <path 
            d="M 100,38 L 40,100 L 100,162 L 100,140 L 62,100 L 100,60 Z" 
            fill={light ? "#ffffff" : "url(#panayGrad)"} 
          />
          {/* A Horizontal Bar */}
          <path 
            d="M 52,100 L 98,100 L 98,92 L 60,92 Z" 
            fill={light ? "#ffffff" : "#7c5cb7"} 
          />
          
          {/* Right Loop Diamond Half (P) */}
          <path 
            d="M 108,38 L 108,162 L 118,162 L 118,112 L 150,112 C 166,112 172,98 172,82 C 172,66 166,52 150,52 L 118,52 L 118,38 Z" 
            fill={light ? "#ffffff" : "url(#panayGrad)"} 
          />
          {/* P Inner Hole */}
          <path 
            d="M 124,64 L 148,64 C 158,64 162,72 162,82 C 162,92 158,100 148,100 L 124,100 Z" 
            fill={light ? "#1e1b4b" : "#ffffff"} 
          />
        </g>
      </svg>
    </div>
  );
};

export const KaalLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size = 40 
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 160 160" 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kaalSphere" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="40%" stopColor="#d8b4fe" />
            <stop offset="80%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <filter id="softPencilShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#3b2b73" floodOpacity="0.25"/>
          </filter>
        </defs>

        {/* Pastel Celestial Crescent Sphere */}
        <circle 
          cx="70" 
          cy="80" 
          r="54" 
          fill="url(#kaalSphere)" 
          className="opacity-90"
        />
        
        {/* Soft highlight arc */}
        <path 
          d="M 35,55 A 48,48 0 0,1 105,45" 
          stroke="#ffffff" 
          strokeWidth="4" 
          strokeLinecap="round" 
          className="opacity-60"
        />

        {/* Flowing 'K' script calligraphy line */}
        <path 
          d="M 36,75 C 50,45 65,45 55,85 C 45,120 70,110 95,95" 
          stroke="#ffffff" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none" 
        />
        <path 
          d="M 50,70 Q 75,68 85,82" 
          stroke="#ffffff" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Dashed trail to pencil */}
        <path 
          d="M 85,115 Q 100,122 112,118" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          strokeDasharray="3 3"
          strokeLinecap="round" 
          fill="none" 
          className="opacity-80"
        />

        {/* Iconic Team KAAL Pencil */}
        <g transform="translate(75, 88) rotate(35)" filter="url(#softPencilShadow)">
          {/* Pencil Body */}
          <rect x="0" y="0" width="46" height="14" rx="4" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          {/* Center Groove */}
          <line x1="12" y1="7" x2="38" y2="7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          {/* Eraser Band */}
          <rect x="-6" y="0" width="8" height="14" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="2.5" />
          {/* Pencil Tip Cone */}
          <polygon points="46,0 60,7 46,14" fill="#fde047" stroke="#334155" strokeWidth="2" />
          {/* Lead Tip */}
          <polygon points="54,4 60,7 54,10" fill="#1e293b" />
        </g>
      </svg>
    </div>
  );
};

export const Sb19WakasLogo: React.FC<{ className?: string; color?: string }> = ({ 
  className = "w-28 h-auto",
  color = "#7c5cb7"
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SB Diamond Monogram */}
      <div className="flex items-center justify-center mb-0.5">
        <svg viewBox="0 0 60 45" className="w-7 h-5" fill="none">
          <path 
            d="M 30,2 L 52,22 L 30,42 L 8,22 Z" 
            stroke={color} 
            strokeWidth="3.5" 
            fill="none"
          />
          <text 
            x="30" 
            y="26" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fill={color} 
            fontSize="14" 
            fontWeight="900" 
            fontFamily="sans-serif"
          >
            SB
          </text>
        </svg>
      </div>

      {/* Stylized Typography: SB19 */}
      <span className="text-[10px] font-black tracking-widest uppercase text-slate-800" style={{ color }}>
        SB19
      </span>

      {/* Stylized Gothic: WAKAS AT SIMULA */}
      <span className="text-xs font-black tracking-wider uppercase text-purple-900 border-t border-b border-purple-200 py-0.5 px-2 mt-0.5 bg-purple-50/80 rounded">
        WAKAS AT SIMULA
      </span>
    </div>
  );
};
