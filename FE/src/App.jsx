import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
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
