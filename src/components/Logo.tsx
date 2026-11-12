import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * RoleFlow mark: a rounded accent tile with a single flowing wave.
 * Colors come from design tokens (fill-accent, stroke-app), so it adapts to light and dark themes.
 */
export const Logo: React.FC<LogoProps> = ({ size = 28, showText = true, className = "" }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="9" className="fill-accent" />
        <path
          d="M6.5 18.5C9.5 12.5 12 12.5 15.5 18.5S21.5 24.5 25.5 13.5"
          className="stroke-app"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 23.5C9.5 17.5 12 17.5 15.5 23.5S21.5 29.5 25.5 18.5"
          className="stroke-app"
          strokeOpacity="0.45"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-display text-xl font-medium tracking-tight text-ink">RoleFlow</span>
      )}
    </div>
  );
};
