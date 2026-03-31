import React, { useState } from 'react';
import LoginScreen from './components/ui/LoginScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [merchantName, setMerchantName] = useState('');

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(name) => { setMerchantName(name); setIsLoggedIn(true); }} />;
  }

  return <Dashboard merchantName={merchantName} onLogout={() => setIsLoggedIn(false)} />;
}
