import { useId } from 'react';

// The mark is a "K" built from equalizer bars: a full-height stem plus
// bars that grow outward, like the letter's open arms.
export default function Logo({ size = 36, withText = true, className = '' }) {
  const gid = useId();
  return (
    <span className={`logo ${className}`}>
      <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff5d3a" />
            <stop offset="1" stopColor="#ffb23f" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
        <g fill="#0b0a10">
          <rect className="bar b0" x="8" y="8" width="4" height="24" rx="2" />
          <rect className="bar b1" x="15" y="17" width="4" height="6" rx="2" />
          <rect className="bar b2" x="21" y="14" width="4" height="12" rx="2" />
          <rect className="bar b3" x="27" y="10" width="4" height="20" rx="2" />
        </g>
      </svg>
      {withText && (
        <span className="logo-text">
          KM<span>Artists</span>
        </span>
      )}
    </span>
  );
}
