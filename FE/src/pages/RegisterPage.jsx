import React from 'react';
import AuthPage from '../auth/AuthPage';

export default function RegisterPage({ onAuthSuccess }) {
  return <AuthPage initialMode="register" onAuthSuccess={onAuthSuccess} />;
}
