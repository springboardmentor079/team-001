import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const Signup = ({ onSignupSuccess, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Project Manager');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Form Validations
    if (!fullName.trim() || !email.trim() || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      // Connect to real backend API: POST /api/auth/signup
      const response = await api.signup({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setSuccess(response.message || 'Account created successfully!');
      
      setTimeout(() => {
        if (onSignupSuccess) {
          onSignupSuccess(response.user);
        } else if (onNavigateToLogin) {
          onNavigateToLogin();
        }
      }, 1000);

    } catch (err) {
      // Detailed error handling for duplicate user, invalid input, server errors
      const msg = err.message || '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(msg || 'Unable to create account with backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_28%),linear-gradient(135deg,_#ffffff,_#fff7d6_42%,_#f5f5f5)] text-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 rounded-[26px] shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-yellow-200 p-8 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-black mb-1">
          Build<span className="text-[#facc15]">Track</span>
        </h1>
        <h2 className="text-sm text-gray-600 mb-6">Create your project stakeholder account</h2>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name*</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              disabled={loading}
              className="w-full bg-white border border-yellow-200 rounded-xl px-3.5 py-2.5 text-xs text-black placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] focus:ring-2 focus:ring-yellow-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email*</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@buildtrack.io"
              disabled={loading}
              className="w-full bg-white border border-yellow-200 rounded-xl px-3.5 py-2.5 text-xs text-black placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] focus:ring-2 focus:ring-yellow-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Role*</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full bg-white border border-yellow-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-[#facc15] focus:ring-2 focus:ring-yellow-200"
            >
              <option value="Project Manager">Project Manager</option>
              <option value="Site Engineer">Site Engineer</option>
              <option value="Contractor">Contractor</option>
              <option value="Administrator">Administrator</option>
              <option value="Worker">Site Worker</option>
              <option value="Client">Client / Investor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password*</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-yellow-200 rounded-xl px-3.5 py-2.5 text-xs text-black placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] focus:ring-2 focus:ring-yellow-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-black"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#facc15] hover:bg-[#fcd34d] text-black font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_14px_28px_rgba(250,204,21,0.22)]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-700 text-center">
          Already registered?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#f59e0b] hover:underline font-bold cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
