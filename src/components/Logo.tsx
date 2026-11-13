import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 28, showText = true, className = "" }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* RoleFlow Dual Wave Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105 shrink-0"
      >
        <defs>
          <linearGradient id="rf-top-wave-logo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="45%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="rf-bot-wave-logo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="#242422" />
        {/* Under wave (terracotta warm shadow wave) */}
        <path
          d="M 26 57.5 C 30 46, 36 45, 41 46.5 C 47 48.5, 52 64.5, 60.5 66.5 C 66 67.5, 71 63, 74 57"
          fill="none"
          stroke="url(#rf-bot-wave-logo)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        {/* Top wave (amber to orange vibrant hero wave) */}
        <path
          d="M 26 48 C 30 36.5, 36 35.5, 41 37 C 47 39, 52 55.5, 60.5 57.5 C 66 58.5, 71 54, 74 48"
          fill="none"
          stroke="url(#rf-top-wave-logo)"
          strokeWidth="9.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-serif text-xl tracking-tight text-[#f3f3ee] font-medium">
          RoleFlow
        </span>
      )}
    </div>
  );
};
