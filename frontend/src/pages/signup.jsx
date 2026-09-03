import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Signup = ({ onSignupSuccess, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validations
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    // Password rule: Uppercase, lowercase, and a number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      setError('Use uppercase, lowercase and a number.');
      return;
    }

    setLoading(true);

    // 1. Create a Unique User ID in Frontend
    const newUserId = 'usr_' + Date.now();
    const newUser = {
      id: newUserId,
      userId: newUserId,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: 'PROJECT_MANAGER', // default role
      token: 'jwt_' + newUserId,
      createdAt: new Date().toISOString()
    };

    try {
      // 2. Try calling Backend API if server is running
      let registered = false;
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        if (response.ok) {
          registered = true;
        }
      } catch (err) {
        console.log('Backend not reachable, saving to local session state');
      }

      // 3. Fallback: Save in localStorage so user can always log in
      const existingUsers = JSON.parse(localStorage.getItem('buildtrack_users') || '[]');
      existingUsers.push(newUser);
      localStorage.setItem('buildtrack_users', JSON.stringify(existingUsers));
      localStorage.setItem('buildtrack_current_user', JSON.stringify(newUser));

      setSuccess('Account created successfully!');
      
      setTimeout(() => {
        if (onSignupSuccess) {
          onSignupSuccess(newUser);
        } else if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          window.location.reload();
        }
      }, 800);

    } catch (err) {
      setError('Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">BuildTrack</h1>
        <h2 className="text-lg text-slate-700 mb-6">Sign up</h2>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full name*</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. suriyan"
              className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email*</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password*</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Use uppercase, lowercase and a number.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
