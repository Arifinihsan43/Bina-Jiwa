import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, AudioLines } from 'lucide-react';

export default function AudioPlayerCard({ 
  title = "Audio Relaksasi Grounding 5 Menit",
  subtitle = "Panduan Klinis Pengendalian Kecemasan",
  initialTime = 45,
  duration = 300 // 5 minutes in seconds
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const timerRef = useRef(null);

  // Toggle Play / Pause
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Waveform bars height profile
  const barHeights = [
    30, 45, 75, 50, 90, 60, 40, 85, 100, 70, 55, 95, 80, 45, 65,
    90, 100, 60, 40, 75, 85, 50, 95, 70, 45, 60, 80, 55, 35
  ];

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div className="audio-card-container">
      {/* Header Info */}
      <div className="audio-card-header">
        <div className="audio-card-icon-box">
          <AudioLines size={22} className="audio-icon" />
        </div>
        <div className="audio-card-info">
          <h4 className="audio-card-title">{title}</h4>
          <p className="audio-card-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Player Section */}
      <div className="audio-player-body">
        <button 
          type="button" 
          className={`audio-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? "Jeda Audio" : "Putar Audio"}
        >
          {isPlaying ? <Pause size={18} fill="#ffffff" /> : <Play size={18} fill="#ffffff" className="play-icon-offset" />}
        </button>

        {/* Waveform graphic */}
        <div className="audio-waveform-container" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          setCurrentTime(Math.floor(ratio * duration));
        }}>
          <div className="audio-waveform-bars">
            {barHeights.map((h, idx) => {
              const barProgress = (idx / barHeights.length) * 100;
              const isActive = barProgress <= progressPercent;
              return (
                <span
                  key={idx}
                  className={`waveform-bar ${isActive ? 'active' : ''} ${isPlaying && isActive ? 'animated' : ''}`}
                  style={{ 
                    height: `${h}%`,
                    animationDelay: `${(idx % 5) * 0.15}s`
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Time stamps */}
        <div className="audio-timestamps">
          <span className="time-current">{formatTime(currentTime)}</span>
          <span className="time-duration">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
