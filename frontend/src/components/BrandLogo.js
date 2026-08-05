import React from 'react';
import { Link } from 'react-router-dom';

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

/**
 * Shared Alive Health brand mark using the public logo asset.
 */
const BrandLogo = ({
  to = '/',
  size = 'md',
  showName = true,
  subtitle,
  stacked = false,
  inverted = false,
  className = '',
  nameClassName = '',
  imageClassName = ''
}) => {
  const imgSize = sizeMap[size] || sizeMap.md;
  const nameColor = inverted ? 'text-white' : 'text-ink-900';
  const subColor = inverted ? 'text-white/70' : 'text-ink-500';

  const content = (
    <span
      className={`inline-flex items-center ${stacked ? 'flex-col gap-2 text-center' : 'gap-2.5'} ${className}`}
    >
      <img
        src="/logo.png"
        alt="Alive Health"
        className={`${imgSize} shrink-0 object-contain ${imageClassName}`}
      />
      {showName || subtitle ? (
        <span className={stacked ? '' : 'min-w-0'}>
          {showName ? (
            <span
              className={`block text-[15px] font-bold tracking-tight ${nameColor} ${nameClassName}`}
            >
              Alive Health UG
            </span>
          ) : null}
          {subtitle ? (
            <span className={`block text-[11px] leading-tight ${subColor}`}>{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="self-start no-underline" aria-label="Alive Health UG home">
      {content}
    </Link>
  );
};

export default BrandLogo;
