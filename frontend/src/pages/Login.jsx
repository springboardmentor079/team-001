import React, { useState } from 'react';
import { HardHat, Mail, Lock, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../services/api';

export const Login = ({ onLoginSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both work email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      if (onLoginSuccess && response?.user) {
        onLoginSuccess(response.user, response.token);
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'radial-gradient(circle at top, rgba(250, 204, 21, 0.18), transparent 28%), linear-gradient(135deg, #ffffff 0%, #fff7d6 42%, #f5f5f5 100%)', color: '#111111' }}>
      <div className="w-full max-w-[1180px] rounded-[30px] border border-yellow-200 bg-white/95 p-5 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-yellow-300 bg-[#facc15] text-black shadow-[0_10px_22px_rgba(250,204,21,0.28)]">
                <HardHat className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-[2rem] font-black tracking-[-0.06em] leading-none text-black">
                  Build<span className="text-[#facc15]">Track</span>
                </h1>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-600">
                  Construction Management Platform
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-[2.8rem] font-black leading-[0.95] tracking-[-0.06em] text-black">
                Enterprise Field Ops & <br />
                <span className="text-[#f59e0b]">Milestone Governance</span>
              </h2>
              <p className="text-[12px] font-medium leading-relaxed text-gray-700">
                Role-based access for Project Managers, Site Engineers, Workers, Clients, and Administrators.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 pt-3">
            <div className="rounded-[22px] border border-yellow-200 bg-[#fffdf7] p-5 sm:p-6 shadow-[0_18px_34px_rgba(0,0,0,0.06)]">
              <h3 className="mb-5 text-[2rem] font-black tracking-[-0.06em] text-black">Sign In to Workspace</h3>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-gray-800">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@buildtrack.io"
                      required
                      disabled={loading}
                      className="w-full rounded-[12px] border border-yellow-200 bg-white py-2.5 pl-10 pr-3 text-[12px] text-black placeholder:text-gray-500 focus:border-[#facc15] focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-bold text-gray-800">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                      className="w-full rounded-[12px] border border-yellow-200 bg-white py-2.5 pl-10 pr-3 text-[12px] text-black placeholder:text-gray-500 focus:border-[#facc15] focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full py-3 text-[15px] cursor-pointer" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    'Authenticate & Enter'
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-[12px] text-gray-700">
                  Don't have an account?{' '}
                  <button type="button" onClick={onNavigateToSignup} className="font-bold text-[#f59e0b] underline-offset-2 hover:underline cursor-pointer">
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
