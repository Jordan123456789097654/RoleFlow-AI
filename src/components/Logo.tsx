import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 28, showText = true, className = "" }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Flow Wave: stylized dual flowing harmonic wave in gradient amber/coral */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="roleflow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path
          d="M4 16C8 7 12 7 16 16C20 25 24 25 28 16"
          stroke="url(#roleflow-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 22C8 13 12 13 16 22C20 31 24 31 28 22"
          stroke="url(#roleflow-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.45"
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
