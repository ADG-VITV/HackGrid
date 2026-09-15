'use client';

import React from 'react';
import { FaDiscord } from 'react-icons/fa6';

interface IconProps {
  className?: string;
}

export function IconPhone({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
    </svg>
  );
}

export function IconInstagram({ className = 'h-5 w-5' }: IconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fill-none stroke-current stroke-2 ${className}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function IconLinkedIn({ className = 'h-5 w-5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

export function IconX({ className = 'h-5 w-5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function IconDiscord({ className = 'h-5 w-5' }: IconProps): React.JSX.Element {
  return <FaDiscord className={className} aria-hidden="true" focusable="false" />;
}

export function IconEmail({ className = 'h-5 w-5' }: IconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fill-none stroke-current stroke-2 ${className}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}