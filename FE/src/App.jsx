import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/ui/Hero';
import Features from './components/ui/Features';
import Steps from './components/ui/Steps';
import TabFeatureShowcase from './components/ui/TabFeatureShowcase';
import EventsSection from './components/ui/EventsSection';
import CtaBanner from './components/ui/CtaBanner';
import FaqSection from './components/ui/FaqSection';
import AnimatedBackground from './components/ui/AnimatedBackground';
import AuthModal from './auth/AuthModal';
import AuthPage from './auth/AuthPage';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [view, setView] = useState('landing'); // 'landing' | 'authPage'
  const [user, setUser] = useState(null);

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Render standalone page if view is 'authPage'
  if (view === 'authPage') {
    return (
      <AuthPage
        initialMode={authModalMode}
        onBackToHome={() => setView('landing')}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="app-main">
      <AnimatedBackground />
      <Navbar 
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        user={user}
        onLogout={handleLogout}
      />
      <main>
        <Hero onOpenAuth={handleOpenAuth} />
        <Features />
        <Steps />
        <TabFeatureShowcase />
        <EventsSection />
        <CtaBanner onOpenAuth={handleOpenAuth} />
        <FaqSection />
      </main>
      <Footer />

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
