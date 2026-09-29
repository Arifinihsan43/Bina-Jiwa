import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { getCachedUser, restoreSession, logoutService } from './service/authService';
import './App.css';

function App() {
  const [user, setUser] = useState(getCachedUser);
  const navigate = useNavigate();

  // Validasi sesi tersimpan ke backend saat aplikasi dibuka / di-refresh.
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((restored) => {
      if (!cancelled) setUser(restored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    logoutService();
  };

  return (
    <AppRoutes
      user={user}
      onAuthSuccess={handleAuthSuccess}
      onLogout={handleLogout}
    />
  );
}

export default App;
