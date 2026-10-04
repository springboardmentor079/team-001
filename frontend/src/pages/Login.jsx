import React, { useState } from 'react';
import { Leaf, Mail, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#E3DFD5] bg-white shadow-[0_24px_64px_-24px_rgba(27,67,50,0.24)] lg:min-h-[640px] lg:grid-cols-2">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#1B4332] p-7 text-white sm:p-10 lg:p-12">
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -right-8 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2F3EB]/15 text-[#52B788]"><Leaf className="h-6 w-6" /></span>
            <div><h1 className="text-xl font-extrabold text-white">BuildTrack</h1><p className="text-[11px] text-[#E3DFD5]">Sustainable construction management</p></div>
          </div>
          <div className="relative my-12 lg:my-0">
            <p className="mb-4 text-xs font-bold uppercase text-[#91CFAE]">Field operations, connected</p>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white sm:text-4xl">Build safer. Build better.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#E3DFD5]">Bring project progress, people, materials, and site updates into one clear workspace.</p>
          </div>
          <div className="relative flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-[#E3DFD5]"><ShieldCheck className="h-4 w-4 text-[#52B788]" /><span>One workspace for every stage of the build.</span></div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <p className="text-xs font-bold uppercase text-[#429B72]">Welcome back</p>
            <h3 className="mt-2 text-2xl font-extrabold text-[#1B4332] sm:text-3xl">Sign in to your workspace</h3>
            <p className="mt-2 text-sm text-gray-500">Use your registered account to continue.</p>
            {error && <div role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-[#D97757]/30 bg-[#F8EBE7] p-3 text-sm font-semibold text-[#9B4D37]"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div>}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div><label className="mb-2 block text-sm font-semibold text-[#1B4332]" htmlFor="login-email">Work email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required disabled={loading} autoComplete="email" className="w-full rounded-xl border border-[#E3DFD5] bg-white py-3 pl-10 pr-3 text-sm text-[#1B4332] outline-none transition focus:border-[#52B788] focus:ring-2 focus:ring-[#52B788]/20" /></div></div>
              <div><label className="mb-2 block text-sm font-semibold text-[#1B4332]" htmlFor="login-password">Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required disabled={loading} autoComplete="current-password" className="w-full rounded-xl border border-[#E3DFD5] bg-white py-3 pl-10 pr-3 text-sm text-[#1B4332] outline-none transition focus:border-[#52B788] focus:ring-2 focus:ring-[#52B788]/20" /></div></div>
              <Button type="submit" variant="primary" className="w-full py-3 text-sm" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="h-4 w-4" /></>}</Button>
            </form>
            <p className="mt-7 text-center text-sm text-gray-600">New to BuildTrack? <button type="button" onClick={onNavigateToSignup} className="font-bold text-[#429B72] underline-offset-2 hover:underline">Create an account</button></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
