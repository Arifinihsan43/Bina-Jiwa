import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smile, CheckCircle, ArrowRight, Sun, Cloud, CloudRain, Wind, Zap, Heart, AlertCircle, Lock } from 'lucide-react';
import { FACTORS, intensityLabel, formatWibTime } from '../../../service/moodService';

const MOOD_BUTTONS = [
  { id: 'Sangat Baik', icon: Sun },
  { id: 'Tenang', icon: Heart },
  { id: 'Biasa', icon: Cloud },
  { id: 'Cemas', icon: Wind },
  { id: 'Sedih', icon: CloudRain },
  { id: 'Lelah', icon: Zap },
];

/**
 * Check-in mood harian.
 * - todayLog: log hari ini (bila sudah diisi → tampilan terkunci)
 * - onSave({ mood, intensity, factors, note }): Promise, lempar Error bila gagal
 */
export default function MoodCheckInCard({ todayLog, loading = false, onSave, showCalendarLink = false }) {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('Tenang');
  const [intensity, setIntensity] = useState(3);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const locked = Boolean(todayLog);

  const toggleFactor = (factor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleSaveClick = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ mood: selectedMood, intensity, factors: selectedFactors, note });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan catatan mood.');
    } finally {
      setSaving(false);
    }
  };

  const shownMood = locked ? todayLog.mood : selectedMood;
  const shownIntensity = locked ? todayLog.intensity : intensity;
  const shownFactors = locked ? todayLog.factors : selectedFactors;

  return (
    <div className="db-card db-mood-card">
      <div className="db-card-header" style={{ paddingRight: '48px' }}>
        <div className="db-card-title-group" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div className="db-card-icon-wrapper">
            <Smile size={20} color="#0284c7" />
          </div>
          <h2 className="db-card-title">Check-in Suasana Hati</h2>
          <span className={`db-badge ${locked ? 'db-badge-cyan' : 'db-badge-required'}`}>
            {locked ? 'Sudah diisi hari ini' : 'Wajib Harian'}
          </span>
        </div>
      </div>

      <p className="db-card-subtitle">
        {locked
          ? `Tercatat pukul ${formatWibTime(todayLog.timestamp)}. Catatan hari ini sudah terkunci — sampai jumpa besok!`
          : 'Pilihlah nuansa batinmu hari ini untuk memantau ritme ketenanganmu.'}
      </p>

      {loading ? (
        <p className="db-card-subtitle">Memuat catatan hari ini…</p>
      ) : (
        <>
          {/* Mood Buttons Grid */}
          <div className="db-mood-grid">
            {MOOD_BUTTONS.map((m) => {
              const Icon = m.icon;
              const isSelected = shownMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`db-mood-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(m.id)}
                  disabled={locked}
                  aria-pressed={isSelected}
                >
                  <Icon size={24} className="db-mood-btn-icon" />
                  <span className="db-mood-btn-label">{m.id}</span>
                </button>
              );
            })}
          </div>

          {/* Intensity Slider */}
          <div className="db-intensity-section">
            <div className="db-intensity-header">
              <span className="db-field-label">Intensitas Emosi</span>
              <span className="db-badge db-badge-cyan">{intensityLabel(shownIntensity)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={shownIntensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="db-intensity-slider"
              disabled={locked}
              aria-label="Intensitas emosi"
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
              {FACTORS.map((factor) => {
                const isSelected = shownFactors.includes(factor);
                return (
                  <button
                    key={factor}
                    type="button"
                    className={`db-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleFactor(factor)}
                    disabled={locked}
                    aria-pressed={isSelected}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan singkat */}
          {locked ? (
            todayLog.note && <p className="db-mood-note-readonly">“{todayLog.note}”</p>
          ) : (
            <textarea
              className="db-textarea db-mood-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan singkat (opsional) — apa yang paling terasa hari ini?"
            />
          )}

          {error && (
            <div className="auth-error-alert" style={{ marginBottom: 0 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer / Submit Row */}
          <div className="db-mood-footer">
            <div className="db-sync-info">
              {locked ? <Lock size={16} color="#0284c7" /> : <CheckCircle size={16} color="#0284c7" />}
              <span>{locked ? 'Tersimpan di akunmu' : 'Hanya kamu yang dapat melihat catatan ini'}</span>
            </div>
            {locked ? (
              showCalendarLink && (
                <button type="button" className="db-btn-primary" onClick={() => navigate('/mood')}>
                  <span>Lihat Kalender Mood</span>
                  <ArrowRight size={16} />
                </button>
              )
            ) : (
              <button type="button" className="db-btn-primary" onClick={handleSaveClick} disabled={saving}>
                <span>{saving ? 'Menyimpan…' : 'Simpan Mood Hari Ini'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
