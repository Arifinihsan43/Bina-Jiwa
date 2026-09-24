import React, { useState } from 'react';
import { Smile, CheckCircle, ArrowRight, Sun, Cloud, CloudRain, Wind, Zap, Heart } from 'lucide-react';

export default function MoodCheckInCard({ initialData, onSave }) {
  const [selectedMood, setSelectedMood] = useState(initialData?.currentMood || 'Tenang');
  const [intensity, setIntensity] = useState(initialData?.intensityLevel || 4);
  const [selectedFactors, setSelectedFactors] = useState(initialData?.factors || ['Keluarga • Rumah', 'Kualitas Tidur']);
  const [isSaved, setIsSaved] = useState(false);

  const moods = [
    { id: 'Sangat Baik', label: 'Sangat Baik', icon: Sun, color: '#f59e0b' },
    { id: 'Tenang', label: 'Tenang', icon: Heart, color: '#0284c7' },
    { id: 'Biasa', label: 'Biasa', icon: Cloud, color: '#64748b' },
    { id: 'Cemas', label: 'Cemas', icon: Wind, color: '#0ea5e9' },
    { id: 'Sedih', label: 'Sedih', icon: CloudRain, color: '#3b82f6' },
    { id: 'Lelah', label: 'Lelah', icon: Zap, color: '#10b981' },
  ];

  const factors = [
    'Pekerjaan',
    'Keluarga • Rumah',
    'Hubungan Sosial',
    'Kualitas Tidur',
    'Kebugaran Fisik',
    '+ Faktor Lain',
  ];

  const toggleFactor = (factor) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const getIntensityText = (lvl) => {
    if (lvl <= 1) return 'Tingkat 1 (Sangat Samar)';
    if (lvl === 2) return 'Tingkat 2 (Samar)';
    if (lvl === 3) return 'Tingkat 3 (Sedang)';
    if (lvl === 4) return 'Tingkat 4 (Nyaman & Tenang)';
    return 'Tingkat 5 (Sangat Kuat)';
  };

  const handleSaveClick = () => {
    setIsSaved(true);
    if (onSave) {
      onSave({ mood: selectedMood, intensity, factors: selectedFactors });
    }
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="db-card db-mood-card">
      <div className="db-card-header" style={{ paddingRight: '48px' }}>
        <div className="db-card-title-group" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div className="db-card-icon-wrapper">
            <Smile size={20} color="#0284c7" />
          </div>
          <h2 className="db-card-title">Check-in Suasana Hati</h2>
          <span className="db-badge db-badge-required">Wajib Harian</span>
        </div>
      </div>

      <p className="db-card-subtitle">
        Pilihlah nuansa batinmu pagi ini untuk memantau ritme ketenanganmu.
      </p>

      {/* Mood Buttons Grid */}
      <div className="db-mood-grid">
        {moods.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`db-mood-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedMood(m.id)}
            >
              <Icon size={24} className="db-mood-btn-icon" />
              <span className="db-mood-btn-label">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Intensity Slider */}
      <div className="db-intensity-section">
        <div className="db-intensity-header">
          <span className="db-field-label">Intensitas Emosi</span>
          <span className="db-badge db-badge-cyan">{getIntensityText(intensity)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="db-intensity-slider"
        />
        <div className="db-intensity-labels">
          <span>Samar</span>
          <span>Sedang</span>
          <span>Sangat Kuat</span>
        </div>
      </div>

      {/* Factors Selection Chips */}
      <div className="db-factors-section">
        <span className="db-field-label">Faktor yang mempengaruhi hari ini:</span>
        <div className="db-chips-group">
          {factors.map((factor) => {
            const isSelected = selectedFactors.includes(factor);
            return (
              <button
                key={factor}
                type="button"
                className={`db-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleFactor(factor)}
              >
                {factor}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Submit Row */}
      <div className="db-mood-footer">
        <div className="db-sync-info">
          <CheckCircle size={16} color="#0284c7" />
          <span>{isSaved ? 'Berhasil disimpan!' : 'Tersinkronisasi otomatis'}</span>
        </div>
        <button
          type="button"
          className="db-btn-primary"
          onClick={handleSaveClick}
        >
          <span>{isSaved ? 'Tersimpan ✓' : 'Perbarui Catatan Mood'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
