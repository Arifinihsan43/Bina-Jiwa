import React, { useState } from 'react';
import { Edit3, CheckCircle } from 'lucide-react';

export default function QuickReflectionCard({ initialPrompt, onSave }) {
  const [reflectionText, setReflectionText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const question = initialPrompt || '“Satu hal kecil apa yang patut kamu syukuri dan hangatkan hatimu pagi ini?”';
  const wordCount = reflectionText.trim() ? reflectionText.trim().split(/\s+/).length : 0;
  const maxWords = 250;

  const handleSave = () => {
    if (!reflectionText.trim()) return;
    setIsSaved(true);
    if (onSave) onSave(reflectionText);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleLater = () => {
    setReflectionText('');
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
        <span className="db-badge db-badge-cyan-soft">Ruang Bebas</span>
      </div>

      {/* Guided Prompt Card */}
      <div className="db-guided-prompt-box">
        <span className="db-prompt-tag">PERTANYAAN PANDUAN</span>
        <p className="db-prompt-text">{question}</p>
      </div>

      {/* Reflection Textarea Input */}
      <div className="db-textarea-wrapper">
        <textarea
          rows={5}
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Tuliskan dengan bebas, tanpa takut dinilai... (mis: secangkir teh hangat, sapaan tetangga, udara sejuk)"
          className="db-textarea"
        />
        <div className="db-textarea-footer">
          <span className="db-privacy-note">Hanya kamu yang dapat membaca ini</span>
          <span className="db-word-counter">{wordCount} / {maxWords} kata</span>
        </div>
      </div>

      {/* Actions */}
      <div className="db-reflection-actions">
        <button type="button" className="db-btn-secondary" onClick={handleLater}>
          Nanti Saja
        </button>
        <button
          type="button"
          className="db-btn-primary"
          onClick={handleSave}
          disabled={!reflectionText.trim()}
        >
          {isSaved ? 'Refleksi Tersimpan ✓' : 'Simpan Refleksi'}
        </button>
      </div>
    </div>
  );
}
