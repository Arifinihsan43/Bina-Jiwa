import React from 'react';
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
import './App.css';

function App() {
  return (
    <div className="app-main">
      <AnimatedBackground />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Steps />
        <TabFeatureShowcase />
        <EventsSection />
        <CtaBanner />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
