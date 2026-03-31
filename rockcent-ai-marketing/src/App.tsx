import React, { useState } from 'react';
import LoginScreen from './components/ui/LoginScreen';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [merchantName, setMerchantName] = useState('');

  return (
    <ErrorBoundary>
      {!isLoggedIn ? (
        <LoginScreen onLogin={(name) => { setMerchantName(name); setIsLoggedIn(true); }} />
      ) : (
        <Dashboard merchantName={merchantName} onLogout={() => setIsLoggedIn(false)} />
      )}
    </ErrorBoundary>
  );
}
