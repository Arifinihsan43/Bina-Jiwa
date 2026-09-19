import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import MoodReflectionPage from '../pages/MoodReflectionPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes({ user, onAuthSuccess, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage user={user} onLogout={onLogout} />} />
      <Route path="/login" element={<LoginPage onAuthSuccess={onAuthSuccess} />} />
      <Route path="/register" element={<RegisterPage onAuthSuccess={onAuthSuccess} />} />
      <Route path="/dashboard" element={<DashboardPage user={user} onLogout={onLogout} />} />
      <Route path="/mood" element={<MoodReflectionPage user={user} onLogout={onLogout} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
