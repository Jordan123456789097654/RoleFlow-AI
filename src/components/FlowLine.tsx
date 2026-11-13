import React from "react";

/**
 * The RoleFlow wave as a divider. Two strokes trace the logo's dual wave once on load.
 * Decorative only: it hides from assistive tech, and reduced-motion users see it drawn.
 */
export const FlowLine: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={`flow-line block h-auto w-full ${className}`}
    viewBox="0 0 600 60"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="rf-flow-grad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#F59E0B" />
        <stop offset="0.5" stopColor="#EA580C" />
        <stop offset="1" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    <path
      pathLength={1}
      d="M4 30 C 90 4, 160 4, 230 30 S 370 56, 440 30 S 540 6, 596 30"
      stroke="url(#rf-flow-grad)"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path
      pathLength={1}
      d="M10 39 C 90 20, 160 20, 230 39 S 370 58, 440 39 S 540 22, 590 39"
      stroke="url(#rf-flow-grad)"
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.5}
    />
  </svg>
);
