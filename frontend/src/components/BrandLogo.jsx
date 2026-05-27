import React from 'react';
import './BrandLogo.css';

const BrandLogo = () => {
  return (
    <div className="brand-logo-container">
      <svg
        width="48"
        height="48"
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-logo-svg"
      >
        <defs>
          <linearGradient id="kh-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="30%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="kh-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <radialGradient id="kh-glow" cx="80%" cy="85%" r="15%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </radialGradient>
          
          <filter id="drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
          </filter>
        </defs>

        <rect width="240" height="240" fill="transparent" />

        <g filter="url(#drop-shadow)">
          {/* Left Vertical of K */}
          <polygon points="30,30 30,210 65,170 65,70" fill="url(#kh-metallic)" className="brand-metallic-shine" />
          
          {/* Top Diagonal of K */}
          <polygon points="65,120 135,30 165,30 95,120" fill="url(#kh-metallic)" className="brand-metallic-shine" />
          
          {/* Bottom Diagonal of K / Tech Tail */}
          <path d="M65,120 L130,210 L160,210 L85,110 Z" fill="url(#kh-metallic)" className="brand-metallic-shine" />
          
          {/* Circuit trace continuing from bottom diagonal */}
          <path d="M140,210 L150,225 L190,225" fill="none" stroke="url(#kh-metallic)" strokeWidth="12" className="brand-circuit-trace" />
          
          {/* Right Vertical of H */}
          <polygon points="175,30 210,70 210,170 175,210" fill="url(#kh-metallic)" className="brand-metallic-shine" />
          
          {/* Crossbar of H extending into an arrow towards K */}
          <polygon points="175,95 125,95 125,75 95,120 125,165 125,145 175,145" fill="url(#kh-metallic)" className="brand-metallic-shine" />
          
          {/* Tech tail node edge */}
          <circle cx="205" cy="225" r="16" fill="url(#kh-metallic)" />
          <circle cx="205" cy="225" r="10" fill="#0B172A" />
          {/* Glowing dot inside the tech node */}
          <circle cx="205" cy="225" r="6" fill="url(#kh-accent)" className="brand-dot" />
          
        </g>
        
        {/* Glow effect on the node */}
        <circle cx="205" cy="225" r="30" fill="url(#kh-glow)" className="brand-glow-circle" style={{mixBlendMode: 'screen'}} />

      </svg>
    </div>
  );
};

export default BrandLogo;
