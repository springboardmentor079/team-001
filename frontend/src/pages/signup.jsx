import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Leaf } from 'lucide-react';
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
      const msg = err.message || '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }

      setError(msg || 'Unable to create your account right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1B4332] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-3xl border border-[#E3DFD5] bg-white p-6 shadow-[0_24px_64px_-24px_rgba(27,67,50,0.2)] sm:p-9">
        <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2F3EB] text-[#429B72]"><Leaf className="h-6 w-6" /></span><div><h1 className="text-xl font-extrabold text-[#1B4332]">BuildTrack</h1><p className="text-[11px] text-gray-500">Sustainable construction management</p></div></div>
        <h2 className="text-2xl font-extrabold text-[#1B4332]">Create your account</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">Set up your project stakeholder profile.</p>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#D97757]/30 bg-[#F8EBE7] p-3 mb-4 text-xs text-[#9B4D37]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-[#52B788]/30 bg-[#E2F3EB] p-3 mb-4 text-xs text-[#1B4332]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1B4332]">Full name*</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              disabled={loading}
              className="w-full rounded-xl border border-[#E3DFD5] bg-white px-3.5 py-3 text-sm text-[#1B4332] placeholder:text-gray-400 focus:border-[#52B788] focus:outline-none focus:ring-2 focus:ring-[#52B788]/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1B4332]">Work email*</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@buildtrack.io"
              disabled={loading}
              className="w-full rounded-xl border border-[#E3DFD5] bg-white px-3.5 py-3 text-sm text-[#1B4332] placeholder:text-gray-400 focus:border-[#52B788] focus:outline-none focus:ring-2 focus:ring-[#52B788]/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1B4332]">Assigned role*</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-[#E3DFD5] bg-white px-3.5 py-3 text-sm font-semibold text-[#1B4332] focus:border-[#52B788] focus:outline-none focus:ring-2 focus:ring-[#52B788]/20"
            >
              <option value="Project Manager">Project Manager</option>
              <option value="Site Engineer">Site Engineer</option>
              <option value="Administrator">Administrator</option>
              <option value="Worker">Site Worker</option>
              <option value="Client">Client / Investor</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1B4332]">Password*</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-[#E3DFD5] bg-white px-3.5 py-3 pr-10 text-sm text-[#1B4332] focus:border-[#52B788] focus:outline-none focus:ring-2 focus:ring-[#52B788]/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-3 text-gray-500 hover:text-[#1B4332]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2D664D] disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="mt-5 text-center text-sm text-gray-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-[#429B72] underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
