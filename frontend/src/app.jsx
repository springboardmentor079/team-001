import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
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
        // If token valid and user data in storage
        const stored = getStoredUser();
        if (stored) {
          setCurrentUser(stored);
        } else if (profile?.user) {
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Connecting to BuildTrack API...</p>
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

  // Authenticated workspace: Navbar + Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <Dashboard currentUser={currentUser} onLogout={handleLogout} />
    </div>
  );
}
