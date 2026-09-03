import React, { useState } from 'react';
import { authService, MOCK_USERS } from '../services/authService.js';
import {
  KeyRound,
  Lock,
  Mail,
  Shield,
  Briefcase,
  Wrench,
  Truck,
  HardHat,
  Building2,
  ArrowRight,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('pm.marcus@buildtrack.io');
  const [password, setPassword] = useState('BuildTrack@2026');
  const [role, setRole] = useState('project_manager');
  const [status, setStatus] = useState(null);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState('site_engineer');

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setStatus('Authenticating & verifying JWT...');
    await authService.login(email, role);
    setTimeout(() => {
      onLoginSuccess(role);
    }, 300);
  };

  const handleQuickPersona = async (selectedRole, selectedEmail) => {
    setRole(selectedRole);
    setEmail(selectedEmail);
    setStatus(`1-Click Login as ${selectedRole.toUpperCase()}...`);
    await authService.login(selectedEmail, selectedRole);
    setTimeout(() => {
      onLoginSuccess(selectedRole);
    }, 250);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setStatus('Registering new stakeholder account...');
    await authService.register({ name: regName, email: regEmail, role: regRole, company: regCompany });
    setTimeout(() => {
      onLoginSuccess(regRole);
    }, 300);
  };

  const personas = [
    { role: 'admin', title: 'Administrator', email: 'admin@buildtrack.io', icon: Shield },
    { role: 'project_manager', title: 'Project Manager', email: 'pm.marcus@buildtrack.io', icon: Briefcase },
    { role: 'site_engineer', title: 'Site Engineer', email: 'engineer.elena@buildtrack.io', icon: Wrench },
    { role: 'contractor', title: 'Contractor', email: 'contractor.david@kaluheavy.com', icon: Truck },
    { role: 'worker', title: 'Site Worker', email: 'ravi.kumar@buildtrack.io', icon: HardHat },
    { role: 'client', title: 'Client / Investor', email: 'victoria@sterlingholdings.com', icon: Building2 },
  ];

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <HardHat className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Build<span className="text-amber-400">Track</span> Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Infosys Internship — Milestone 1: Multi-Role Auth & Construction PM
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border border-slate-800 rounded-xl p-1 bg-slate-950 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            (i) Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            (ii) Register
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forgot')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'forgot' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            (iii) Reset Password
          </button>
        </div>

        {/* 1-Click Role Login Shortcuts */}
        {activeTab === 'login' && (
          <div className="mb-5 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs font-bold text-slate-300 mb-2">1-Click Role Testing (6 Roles)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personas.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleQuickPersona(p.role, p.email)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-left transition-all text-xs"
                  >
                    <Icon className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-400">Click to login</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Persona Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="admin">Administrator (System Health & Logs)</option>
                <option value="project_manager">Project Manager (Schedules & Budget)</option>
                <option value="site_engineer">Site Engineer (Field QA & DSR)</option>
                <option value="contractor">Contractor (Crew & Equipment)</option>
                <option value="worker">Site Worker (Turnstile Attendance)</option>
                <option value="client">Client / Investor (Milestones)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {status && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{status}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Authenticate with JWT & Enter Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                placeholder="e.g. Alex Rivera"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="alex.rivera@skylinecivil.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization</label>
              <input
                type="text"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                required
                placeholder="Skyline Civil Partners Ltd."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="project_manager">Project Manager</option>
                <option value="site_engineer">Site Engineer</option>
                <option value="contractor">Contractor</option>
                <option value="worker">Worker</option>
                <option value="client">Client / Investor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-lg"
            >
              <span>Provision Account & Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Forgot Form */}
        {activeTab === 'forgot' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setForgotSent(true);
            }}
            className="space-y-4"
          >
            {!forgotSent ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Work Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@buildtrack.io"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all"
                >
                  Send OTP Recovery Link
                </button>
              </>
            ) : (
              <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
                <p className="text-xs text-emerald-300 font-bold">Password Reset Link Dispatched</p>
                <p className="text-[11px] text-slate-400">
                  Verification OTP simulated for <span className="text-white">{forgotEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setActiveTab('login');
                  }}
                  className="mt-2 text-xs font-bold text-amber-400 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};