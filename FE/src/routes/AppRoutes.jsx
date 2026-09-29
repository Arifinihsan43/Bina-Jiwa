import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import MoodReflectionPage from '../pages/MoodReflectionPage';
import MessagesPage from '../pages/MessagesPage';
import KomunitasPage from '../pages/KomunitasPage';
import PsikologPage from '../pages/PsikologPage';
import JanjiTemuPage from '../pages/JanjiTemuPage';
import EventsPage from '../pages/EventsPage';
import ProfilPsikologPage from '../pages/ProfilPsikologPage';
import AdminVerifikasiPage from '../pages/AdminVerifikasiPage';
import NotFoundPage from '../pages/NotFoundPage';
import DashboardLayout from '../components/dashboard/navigation/DashboardLayout';

function DashboardLayoutWrapper({ user, onLogout }) {
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <Outlet />
    </DashboardLayout>
  );
}

export default function AppRoutes({ user, onAuthSuccess, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage user={user} onLogout={onLogout} />} />
      <Route path="/login" element={<LoginPage onAuthSuccess={onAuthSuccess} />} />
      <Route path="/register" element={<RegisterPage onAuthSuccess={onAuthSuccess} />} />
      <Route path="/admin" element={<AdminVerifikasiPage />} />

      {/* Shared Dashboard Layout Shell */}
      <Route element={<DashboardLayoutWrapper user={user} onLogout={onLogout} />}>
        <Route path="/dashboard" element={<DashboardPage user={user} onLogout={onLogout} />} />
        <Route path="/mood" element={<MoodReflectionPage user={user} onLogout={onLogout} />} />
        <Route path="/pesan" element={<MessagesPage user={user} onLogout={onLogout} />} />
        <Route path="/komunitas" element={<KomunitasPage user={user} onLogout={onLogout} />} />
        <Route path="/psikolog" element={<PsikologPage user={user} onLogout={onLogout} />} />
        <Route path="/janji-temu" element={<JanjiTemuPage user={user} onLogout={onLogout} />} />
        <Route path="/events" element={<EventsPage user={user} onLogout={onLogout} />} />
        <Route path="/profil-praktik" element={<ProfilPsikologPage user={user} onLogout={onLogout} />} />

      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
