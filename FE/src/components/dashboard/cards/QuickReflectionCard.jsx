import React, { useState } from 'react';
import { Edit3, AlertCircle } from 'lucide-react';

const MAX_WORDS = 250;

/**
 * Refleksi cepat harian, disimpan sebagai jurnal pribadi.
 * - onSave(question, text): Promise
 * - savedToday: jumlah refleksi yang sudah ditulis hari ini
 */
export default function QuickReflectionCard({ question, onSave, savedToday = 0 }) {
  const [reflectionText, setReflectionText] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const wordCount = reflectionText.trim() ? reflectionText.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > MAX_WORDS;

  const handleSave = async () => {
    if (!reflectionText.trim() || overLimit || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(question, reflectionText);
      setReflectionText('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan refleksi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="db-card db-reflection-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <div className="db-card-icon-wrapper">
            <Edit3 size={20} color="#0284c7" />
          </div>
          <h2 className="db-card-title">Refleksi Cepat Harian</h2>
        </div>
        <span className="db-badge db-badge-cyan-soft">
          {savedToday > 0 ? `${savedToday} refleksi hari ini` : 'Ruang Bebas'}
        </span>
      </div>

      {/* Guided Prompt Card */}
      <div className="db-guided-prompt-box">
        <span className="db-prompt-tag">PERTANYAAN PANDUAN HARI INI</span>
        <p className="db-prompt-text">“{question}”</p>
      </div>

      {/* Reflection Textarea Input */}
      <div className="db-textarea-wrapper">
        <textarea
          rows={5}
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Tuliskan dengan bebas, tanpa takut dinilai... (mis: secangkir teh hangat, sapaan tetangga, udara sejuk)"
          className="db-textarea"
          aria-label="Tulisan refleksi"
        />
        <div className="db-textarea-footer">
          <span className="db-privacy-note">Hanya kamu yang dapat membaca ini</span>
          <span className="db-word-counter" style={overLimit ? { color: '#dc2626' } : undefined}>
            {wordCount} / {MAX_WORDS} kata
          </span>
        </div>
      </div>

      {error && (
        <div className="auth-error-alert" style={{ marginBottom: 0 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="db-reflection-actions">
        <button
          type="button"
          className="db-btn-secondary"
          onClick={() => setReflectionText('')}
          disabled={!reflectionText || saving}
        >
          Kosongkan
        </button>
        <button
          type="button"
          className="db-btn-primary"
          onClick={handleSave}
          disabled={!reflectionText.trim() || overLimit || saving}
        >
          {saving ? 'Menyimpan…' : justSaved ? 'Refleksi Tersimpan ✓' : 'Simpan Refleksi'}
        </button>
      </div>
    </div>
  );
}
