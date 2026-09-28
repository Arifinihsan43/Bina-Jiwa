import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard';
import '../styles/janji-temu.css';
import {
  Calendar,
  Clock,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Star,
  FileText,
  Activity,
  X
} from 'lucide-react';

const APPOINTMENTS_DATA = [
  {
    id: 1,
    doctor: 'Tania Azzahra',
    title: 'M.Psi., Psikolog',
    initials: 'TA',
    status: 'menunggu',
    statusLabel: 'Menunggu konfirmasi',
    dateTime: '21/9/2026, 09.21.00 — 21/9/2026, 10.21.00',
    isOnline: true,
    location: 'Via Ruang Telekomunikasi Bina Jiwa',
    notes: 'Mohon bantuannya',
    actionsType: 'pending'
  },
  {
    id: 2,
    doctor: 'Tania Azzahra',
    title: 'M.Psi., Psikolog',
    initials: 'TA',
    status: 'dibatalkan',
    statusLabel: 'Dibatalkan',
    dateTime: '18/9/2026, 13.46.00 — 18/9/2026, 17.46.00',
    isOnline: false,
    location: 'Ruang Konsultasi 03 • Klinik Jakarta Selatan',
    notes: 'Mohon bantuannya',
    cancelReason: 'Dibatalkan oleh sistem atas permintaan pemohon pada 18/9/2026 pukul 11:20',
    actionsType: 'canceled'
  },
  {
    id: 3,
    doctor: 'Tania Azzahra',
    title: 'M.Psi., Psikolog',
    initials: 'TA',
    status: 'selesai',
    statusLabel: 'Selesai',
    dateTime: '17/9/2026, 21.52.00 — 18/9/2026, 21.52.00',
    isOnline: false,
    location: 'Sesi Konsultasi Khusus / Rawat Jalan',
    notes: 'Mohon bantuannya',
    actionsType: 'completed_1'
  },
  {
    id: 4,
    doctor: 'Tania Azzahra',
    title: 'M.Psi., Psikolog',
    initials: 'TA',
    status: 'selesai',
    statusLabel: 'Selesai',
    dateTime: '17/9/2026, 13.01.00 — 17/9/2026, 15.59.00',
    isOnline: true,
    location: 'Sesi Evaluasi Awal & Diagnostik Mandiri',
    notes: 'Mohon bantuannya',
    actionsType: 'completed_2'
  }
];

export default function JanjiTemuPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('semua');

  const filteredAppointments = APPOINTMENTS_DATA.filter(item => {
    if (activeTab === 'semua') return true;
    if (activeTab === 'menunggu') return item.status === 'menunggu';
    if (activeTab === 'selesai') return item.status === 'selesai';
    if (activeTab === 'dibatalkan') return item.status === 'dibatalkan';
    return true;
  });

  return (
    <div className="db-main-content">
      <DashboardHeader dateInfo="Hari ini, Rabu 25 Oktober 2024 • Bernapaslah dengan tenang" />

      <div className="db-scrollable-body">
        <div className="jt-container">
          {/* Top Filter Bar */}
          <div className="jt-filter-bar">
            <div className="jt-filter-tabs">
              <button
                type="button"
                className={`jt-tab-btn ${activeTab === 'semua' ? 'active' : ''}`}
                onClick={() => setActiveTab('semua')}
              >
                Semua <span className="jt-tab-count">4</span>
              </button>
              <button
                type="button"
                className={`jt-tab-btn ${activeTab === 'menunggu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menunggu')}
              >
                Menunggu Konfirmasi <span className="jt-tab-count">1</span>
              </button>
              <button
                type="button"
                className={`jt-tab-btn ${activeTab === 'selesai' ? 'active' : ''}`}
                onClick={() => setActiveTab('selesai')}
              >
                Selesai <span className="jt-tab-count">2</span>
              </button>
              <button
                type="button"
                className={`jt-tab-btn tab-dibatalkan ${activeTab === 'dibatalkan' ? 'active' : ''}`}
                onClick={() => setActiveTab('dibatalkan')}
              >
                Dibatalkan <span className="jt-tab-count">1</span>
              </button>
            </div>

            <button type="button" className="jt-period-btn">
              <Calendar size={16} />
              <span>Periode: September 2026</span>
            </button>
          </div>

          {/* Appointments List */}
          <div className="jt-list">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="jt-card">
                {/* Card Header */}
                <div className="jt-card-header">
                  <div className="jt-doctor-group">
                    <div className="jt-avatar-initials">{apt.initials}</div>
                    <div>
                      <span className="jt-doctor-name">{apt.doctor}</span>
                      <span className="jt-doctor-title">{apt.title}</span>
                    </div>
                  </div>
                  <div className={`jt-status-badge ${apt.status}`}>
                    <span className="jt-status-dot"></span>
                    <span>{apt.statusLabel}</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="jt-card-meta">
                  <div className="jt-meta-row">
                    <Clock size={16} className="jt-meta-icon" />
                    <span>{apt.dateTime}</span>
                  </div>
                  <div className="jt-mode-row">
                    <span className={`jt-mode-badge ${apt.isOnline ? 'online' : 'offline'}`}>
                      {apt.isOnline ? '• ONLINE' : 'OFFLINE'}
                    </span>
                    <span className="jt-venue-text">{apt.location}</span>
                  </div>
                </div>

                {/* Notes */}
                {apt.notes && (
                  <div className="jt-notes-box">
                    <MessageSquare size={16} className="jt-notes-icon" />
                    <span>Catatan: "{apt.notes}"</span>
                  </div>
                )}

                {/* Cancellation details if any */}
                {apt.cancelReason && (
                  <div className="jt-cancel-alert">
                    <div className="jt-cancel-info">
                      <AlertCircle size={15} />
                      <span>{apt.cancelReason}</span>
                    </div>
                    <button type="button" className="jt-replace-btn">
                      <RotateCcw size={14} /> Ajukan Jadwal Pengganti
                    </button>
                  </div>
                )}

                {/* Card Actions Footer */}
                {apt.actionsType === 'pending' && (
                  <div className="jt-actions-row">
                    <div className="jt-actions-left">
                      <button type="button" className="jt-btn-cancel">
                        <X size={15} /> Batalkan
                      </button>
                      <button type="button" className="jt-btn-outline">
                        <Calendar size={14} /> Ubah Waktu
                      </button>
                    </div>
                    <button type="button" className="jt-btn-link">
                      Rincian Verifikasi <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {apt.actionsType === 'completed_1' && (
                  <div className="jt-actions-row">
                    <div className="jt-actions-left">
                      <button type="button" className="jt-btn-outline">
                        <Star size={14} /> Beri Ulasan
                      </button>
                      <button type="button" className="jt-btn-outline">
                        <FileText size={14} /> Ringkasan Klinis
                      </button>
                    </div>
                    <button type="button" className="jt-btn-link">
                      <RotateCcw size={14} /> Jadwalkan Sesi Lanjutan
                    </button>
                  </div>
                )}

                {apt.actionsType === 'completed_2' && (
                  <div className="jt-actions-row">
                    <div className="jt-actions-left">
                      <span className="jt-btn-green">
                        <Star size={14} /> Ulasan 5.0 Diberikan
                      </span>
                      <button type="button" className="jt-btn-outline">
                        <FileText size={14} /> Faktur Asuransi
                      </button>
                    </div>
                    <button type="button" className="jt-btn-link">
                      <Activity size={14} /> Latihan &amp; Resep Afirmasi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
