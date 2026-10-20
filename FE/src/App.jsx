import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { getCachedUser, restoreSession, logoutService } from './service/authService';
import LogoutConfirmModal from './components/common/LogoutConfirmModal';
import './App.css';

function App() {
  const [user, setUser] = useState(getCachedUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const handleUpdateUser = (updatedUserData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUserData,
    }));
  };

  const handleLogoutRequest = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutService();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const handleCancelLogout = () => {
    if (!isLoggingOut) {
      setShowLogoutModal(false);
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <>
      <AppRoutes
        user={user}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogoutRequest}
        onUpdateUser={handleUpdateUser}
      />
      {showLogoutModal && (
        <LogoutConfirmModal
          user={user}
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
          isSubmitting={isLoggingOut}
        />
      )}
    </>
  );
}

export default App;
