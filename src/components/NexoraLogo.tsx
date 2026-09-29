import React from 'react';

export interface NexoraLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  style?: React.CSSProperties;
  secondRectStyle?: React.CSSProperties;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  className = '',
  size = 24,
  showText = true,
  style,
  secondRectStyle,
}) => {
  return (
    <div className={`radar-brand-lockup ${className}`} style={style} role="banner">
      <svg
        className="radar-logo-svg"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform="rotate(-35 16 16)">
          {/* Main vertical rounded bar */}
          <rect
            x="8"
            y="4"
            width="6.5"
            height="24"
            rx="3.25"
            fill="currentColor"
          />
          {/* Parallel secondary offset rounded bar */}
          <rect
            x="17.5"
            y="9"
            width="6.5"
            height="18"
            rx="3.25"
            fill="currentColor"
            style={secondRectStyle}
          />
        </g>
      </svg>
      {showText && <span className="radar-brand-text">NEXORA</span>}
    </div>
  );
};
