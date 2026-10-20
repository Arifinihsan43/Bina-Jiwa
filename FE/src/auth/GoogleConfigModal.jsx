import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';

export default function GoogleConfigModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const callbackUrl = 'https://leezlcfaeqwvplckhgtk.supabase.co/auth/v1/callback';
  const supabaseProjectUrl = 'https://supabase.com/dashboard/project/leezlcfaeqwvplckhgtk/auth/providers';
  const googleConsoleUrl = 'https://console.cloud.google.com/apis/credentials';

  const handleCopy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="google-modal-backdrop" onClick={onClose}>
      <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="google-modal-header">
          <div className="google-modal-icon-badge">
            <svg className="google-icon" width="22" height="22" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div className="google-modal-header-text">
            <h3>Aktivasi Google Login di Supabase</h3>
            <p>Fitur login Google sudah siap di kode aplikasi, tinggal mengaktifkan provider di dashboard Supabase.</p>
          </div>
          <button type="button" className="google-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Body content */}
        <div className="google-modal-body">
          <div className="google-step-list">
            {/* Step 1 */}
            <div className="google-step-item">
              <div className="google-step-num">1</div>
              <div className="google-step-content">
                <h4>Buat OAuth Client ID di Google Cloud</h4>
                <p>
                  Buka Google Cloud Console, buat <strong>OAuth client ID</strong> bertipe <strong>Web application</strong>.
                </p>
                <a
                  href={googleConsoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="google-step-link"
                >
                  <span>Buka Google Cloud Console</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="google-step-item">
              <div className="google-step-num">2</div>
              <div className="google-step-content">
                <h4>Masukkan Authorized Redirect URI</h4>
                <p>
                  Pada pengaturan OAuth Client ID di Google Cloud, tambahkan URI pengalihan resmi Supabase berikut:
                </p>
                <div className="google-copy-box">
                  <code>{callbackUrl}</code>
                  <button type="button" onClick={handleCopy} className="google-copy-btn">
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="google-step-item">
              <div className="google-step-num">3</div>
              <div className="google-step-content">
                <h4>Aktifkan Google Provider di Supabase</h4>
                <p>
                  Buka menu <strong>Authentication &gt; Providers &gt; Google</strong> di project Supabase Anda, aktifkan saklar, lalu masukkan <strong>Client ID</strong> dan <strong>Client Secret</strong> yang didapat dari Google Cloud.
                </p>
                <a
                  href={supabaseProjectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="google-step-link"
                >
                  <span>Buka Supabase Auth Providers</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Step 4 */}
            <div className="google-step-item">
              <div className="google-step-num">4</div>
              <div className="google-step-content">
                <h4>Pastikan Redirect URL Terdaftar</h4>
                <p>
                  Di Supabase <strong>Authentication &gt; URL Configuration</strong>, pastikan <code>http://localhost:5173/auth/callback</code> terdaftar pada Redirect URLs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="google-modal-footer">
          <button type="button" className="auth-btn-primary" onClick={onClose} style={{ width: 'auto', padding: '10px 24px' }}>
            <span>Mengerti &amp; Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}
