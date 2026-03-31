import React from 'react';

const Logo = ({ className = "h-10 w-auto", variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) => {
  const maskId = React.useId();
  const textColor = variant === 'dark' ? '#FFFFFF' : '#18181B';
  const subTextColor = variant === 'dark' ? '#A1A1AA' : '#71717A';

  return (
    <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: variant === 'dark' ? 'drop-shadow(0px 4px 20px rgba(244, 63, 94, 0.2))' : 'none' }}>
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <rect x="16" y="20" width="18" height="18" rx="8" fill="black" />
        </mask>
      </defs>
      <g transform="translate(10, 5)">
        <g mask={`url(#${maskId})`}>
          <rect x="0" y="4" width="34" height="34" rx="10" fill="url(#violet-grad)" />
          <path d="M0 14 C0 8.477 4.477 4 10 4 L34 4 L34 38 L10 38 C4.477 38 0 33.523 0 28 L0 14 Z" fill="#7C3AED" opacity="0.8" style={{ mixBlendMode: 'overlay' }} />
          <rect x="16" y="20" width="44" height="44" rx="12" fill="url(#rose-grad)" />
          <path d="M16 32 C16 25.373 21.373 20 28 20 L60 20 L60 64 L28 64 C21.373 64 16 58.627 16 52 L16 32 Z" fill="#E11D48" opacity="0.7" style={{ mixBlendMode: 'overlay' }} />
        </g>
        <circle cx="46" cy="8" r="9" fill="#F59E0B" style={{ mixBlendMode: 'screen' }} />
      </g>
      <text x="82" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontSize="42" fontWeight="900" fill={textColor} letterSpacing="2">Rockcent</text>
      <text x="84" y="72" fontFamily="system-ui, -apple-system, sans-serif" fontSize="15" fill={subTextColor} letterSpacing="4">AI Marketing Cloud</text>
      <defs>
        <linearGradient id="violet-grad" x1="0" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="rose-grad" x1="16" y1="20" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F43F5E" />
          <stop offset="1" stopColor="#BE123C" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
