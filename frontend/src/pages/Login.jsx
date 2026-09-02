import React, { useState } from 'react';
import { HardHat, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';

export const Login = ({ onLoginSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PROJECT_MANAGER');
  const [error, setError] = useState('');

  const handleQuickLogin = (selectedRole, name, defaultEmail) => {
    onLoginSuccess({
      name,
      email: defaultEmail,
      role: selectedRole,
      token: `jwt-${selectedRole.toLowerCase()}-${Date.now()}`,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both work email and password.');
      return;
    }
    setError('');
    onLoginSuccess({
      name: email.split('@')[0],
      email,
      role,
      token: `jwt-${Date.now()}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Brand & Persona Selector */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <HardHat className="h-7 w-7 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Build<span className="text-amber-400">Track</span>
              </h1>
              <p className="text-xs font-semibold text-slate-400">Construction Management Platform</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Enterprise Field Ops & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Milestone Governance
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-role access for Project Managers, Site Engineers, Contractors, Workers, and Investors.
            </p>
          </div>

          {/* Quick 1-Click Persona Access */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> 1-Click Persona Test Login
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">6 Roles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('PROJECT_MANAGER', 'Marcus Vance', 'marcus.pm@buildtrack.io')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Project Manager</p>
                <p className="text-[10px] text-slate-400">Marcus Vance</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('SITE_ENGINEER', 'Dave K.', 'dave.eng@buildtrack.io')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Site Engineer</p>
                <p className="text-[10px] text-slate-400">Dave K.</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CONTRACTOR', 'Elena Ramos', 'elena.cont@buildtrack.io')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Contractor</p>
                <p className="text-[10px] text-slate-400">Elena Ramos</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ADMINISTRATOR', 'Admin Root', 'admin@buildtrack.io')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Administrator</p>
                <p className="text-[10px] text-slate-400">System Admin</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('SITE_WORKER', 'Sam Wilson', 'sam.worker@buildtrack.io')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Site Worker</p>
                <p className="text-[10px] text-slate-400">Field Crew</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CLIENT', 'Apex Capital', 'investor@apexcap.com')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 cursor-pointer"
              >
                <p className="text-xs font-bold truncate">Client / Investor</p>
                <p className="text-[10px] text-slate-400">Apex Holdings</p>
              </button>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white">Sign In to Workspace</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@buildtrack.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="SITE_ENGINEER">Site Engineer</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                  <option value="SITE_WORKER">Site Worker</option>
                  <option value="CLIENT">Client / Investor</option>
                </select>
              </div>

              <Button type="submit" variant="primary" className="w-full py-3">
                Authenticate & Enter
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
