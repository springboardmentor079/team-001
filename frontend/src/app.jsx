import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Signup } from './pages/signup';
import { Dashboard } from './pages/Dashboard';
import { api, getToken, getStoredUser } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const profile = await api.getProfile();
        if (profile?.user) {
          setCurrentUser(profile.user);
        }
      } catch (err) {
        // Token invalid or expired
        api.logout();
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthMode('login');
  };

  const handleSignupSuccess = (user) => {
    // Switch to login screen after successful signup
    setAuthMode('login');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setAuthMode('login');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] font-sans text-[#1B4332]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-[#52B788] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render Login or Signup page
  if (!currentUser) {
    if (authMode === 'signup') {
      return (
        <Signup
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={() => setAuthMode('login')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => setAuthMode('signup')}
      />
    );
  }

  // Authenticated workspace: Dashboard owns the single workspace header.
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] font-sans text-[#1B4332]">
      <Dashboard currentUser={currentUser} onLogout={handleLogout} />
    </div>
  );
}
