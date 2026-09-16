import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, AlertTriangle } from 'lucide-react';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function NotFoundPage() {
  return (
    <div className="auth-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textCenter: 'center', padding: '20px' }}>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', width: '100%', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px 30px', boxShadow: '0 20px 40px rgba(2, 132, 199, 0.12)', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
        <div style={{ width: '64px', height: '64px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <AlertTriangle size={32} color="#0284c7" />
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>404</h1>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>Halaman Tidak Ditemukan</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
          Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>
        <Link to="/" className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', margin: '0 auto', width: 'fit-content' }}>
          <ArrowLeft size={18} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
