import React from 'react';

// Logo teratai Bina Jiwa (public/LogoBJ-nobg.png, latar transparan).
export default function BinaJiwaLogo({ size = 32, className = "" }) {
  return (
    <img
      src="/LogoBJ-nobg.png"
      alt="Bina Jiwa"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
}
