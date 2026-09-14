import React, { useMemo } from 'react';

export default function AnimatedBackground() {
  // Generate 75 floating particles with randomized positions, sizes, speeds, and delays
  const particles = useMemo(() => {
    return Array.from({ length: 75 }).map((_, i) => {
      const size = Math.floor(Math.random() * 10) + 4; // 4px to 14px
      const left = (Math.random() * 98 + 1).toFixed(2);
      const top = (Math.random() * 98 + 1).toFixed(2);
      const duration = (Math.random() * 16 + 10).toFixed(1); // 10s to 26s
      const delay = (Math.random() * -20).toFixed(1); // negative delay for immediate staggered start
      const opacity = (Math.random() * 0.45 + 0.5).toFixed(2); // 0.5 to 0.95 (highly visible!)
      const colorType = i % 5;

      let color = '#0284c7';
      if (colorType === 1) color = '#0ea5e9';
      if (colorType === 2) color = '#2563eb';
      if (colorType === 3) color = '#0369a1';
      if (colorType === 4) color = '#38bdf8';

      return {
        id: i,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          backgroundColor: color,
          opacity: opacity,
          boxShadow: `0 0 ${size * 2.5}px ${color}, 0 0 ${size}px rgba(255, 255, 255, 0.8)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        },
      };
    });
  }, []);

  return (
    <div className="global-animated-bg" aria-hidden="true">
      {/* Floating Ambient Glow Orbs */}
      <div className="global-bg-orb global-orb-1"></div>
      <div className="global-bg-orb global-orb-2"></div>
      <div className="global-bg-orb global-orb-3"></div>
      <div className="global-bg-orb global-orb-4"></div>
      <div className="global-bg-orb global-orb-5"></div>

      {/* Subtle Dot Mesh Grid */}
      <div className="global-mesh-grid"></div>

      {/* Floating Particles Layer */}
      <div className="particles-container">
        {particles.map((p) => (
          <div key={p.id} className="floating-particle" style={p.style} />
        ))}
      </div>
    </div>
  );
}

