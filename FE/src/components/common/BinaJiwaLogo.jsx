import React from 'react';

export default function BinaJiwaLogo({ size = 22, color = "#ffffff", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Center Petal */}
      <path d="M12 4.5C10 8 10 11.5 12 15C14 11.5 14 8 12 4.5Z" />

      {/* Left Petal */}
      <path d="M12 15C8.5 15 5.5 12 5.5 8.5C8 8.5 10.5 10.5 12 15Z" />

      {/* Right Petal */}
      <path d="M12 15C15.5 15 18.5 12 18.5 8.5C16 8.5 13.5 10.5 12 15Z" />

      {/* Base Arc Cup */}
      <path d="M5.5 12C7 17 17 17 18.5 12" />
    </svg>
  );
}
