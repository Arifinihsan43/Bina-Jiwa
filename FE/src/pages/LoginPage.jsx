import React from 'react';
import AuthPage from '../auth/AuthPage';

export default function LoginPage({ onAuthSuccess }) {
  return <AuthPage initialMode="login" onAuthSuccess={onAuthSuccess} />;
}
