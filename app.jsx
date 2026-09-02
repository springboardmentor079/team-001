import React, { useState } from 'react';
import {
  HardHat,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Briefcase,
  Wrench,
  Truck,
  Building2,
  ArrowRight,
  LogOut,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck,
  FolderKanban,
  Users,
} from 'lucide-react';

// Preset Users for the 6 Infosys Milestone 1 Roles
const PERSONAS = [
  { role: 'project_manager', title: 'Project Manager', email: 'pm.marcus@buildtrack.io', name: 'Marcus Vance', icon: Briefcase },
  { role: 'site_engineer', title: 'Site Engineer', email: 'engineer.elena@buildtrack.io', name: 'Elena Rostova', icon: Wrench },
  { role: 'contractor', title: 'Contractor', email: 'contractor.david@kaluheavy.com', name: 'David Miller', icon: Truck },
  { role: 'admin', title: 'Administrator', email: 'admin@buildtrack.io', name: 'Sarah Chen', icon: Shield },
  { role: 'worker', title: 'Site Worker', email: 'ravi.kumar@buildtrack.io', name: 'Ravi Kumar', icon: HardHat },
  { role: 'client', title: 'Client / Investor', email: 'victoria@sterlingholdings.com', name: 'Victoria Sterling', icon: Building2 },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('pm.marcus@buildtrack.io');
  const [password, setPassword] = useState('BuildTrack@2026');
  const [role, setRole] = useState('project_manager');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [milestones, setMilestones] = useState([
    { id: 1, name: 'Foundation & Earthwork', phase: 'Foundation', progress: 100, status: 'Completed', dates: 'Mar 2025 - Jun 2025' },
    { id: 2, name: 'RCC Superstructure (Lvl 1-15)', phase: 'Structural', progress: 75, status: 'In Progress', dates: 'Jul 2025 - Feb 2026' },
    { id: 3, name: 'Electrical Conduits & Risers', phase: 'Electrical', progress: 45, status: 'In Progress', dates: 'Oct 2025 - May 2026' },
    { id: 4, name: 'Plumbing & Drainage Stacks', phase: 'Plumbing', progress: 50, status: 'In Progress', dates: 'Nov 2025 - Jun 2026' },
    { id: 5, name: 'Facade Glass & Exterior Finishing', phase: 'Finishing', progress: 20, status: 'Not Started', dates: 'Mar 2026 - Sep 2026' },
    { id: 6, name: 'HSE & Structural Compliance Audit', phase: 'Inspection', progress: 10, status: 'Not Started', dates: 'Oct 2026 - Nov 2026' },
  ]);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const persona = PERSONAS.find((p) => p.role === role) || {
      name: email.split('@')[0],
      email,
      role,
    };
    setCurrentUser(persona);
  };

  const handleQuickLogin = (p) => {
    setRole(p.role);
    setEmail(p.email);
    setCurrentUser(p);
  };

  const handleProgressChange = (id, newProgress) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              progress: newProgress,
              status: newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : 'Not Started',
            }
          : m
      )
    );
  };

  // 1. IF NOT LOGGED IN -> SHOW AUTH PAGE
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <HardHat className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white">
              Build<span className="text-amber-400">Track</span> Platform
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Infosys Internship — Milestone 1: Multi-Role Auth & Construction PM
            </p>
          </div>

          {/* 1-Click Role Testing */}
          <div className="mb-6 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs font-bold text-slate-300 mb-2">1-Click Role Login (6 Stakeholder Roles)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleQuickLogin(p)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-left transition-all text-xs cursor-pointer"
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Persona Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="project_manager">Project Manager (Schedules & Budget)</option>
                <option value="site_engineer">Site Engineer (Field QA & DSR)</option>
                <option value="contractor">Contractor (Crew & Machinery)</option>
                <option value="admin">Administrator (System Health)</option>
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

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-lg cursor-pointer"
            >
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. IF LOGGED IN -> SHOW DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950">
            <HardHat className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">
              Build<span className="text-amber-400">Track</span>
            </h1>
            <p className="text-[10px] text-slate-400">Infosys Milestone 1 — Construction PM</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{currentUser.name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              {currentUser.role.toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 border-r border-slate-800 bg-slate-900/40 p-4 hidden md:flex flex-col justify-between">
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Role Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'milestones' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              <span>Projects & Milestones</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resources' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Machinery & Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('workforce')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'workforce' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Workforce & Attendance</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-400">Active Role:</p>
            <p className="text-xs font-bold text-amber-400">{currentUser.role.toUpperCase()}</p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* View 1: Role Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Role View: {currentUser.role}
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-1">Skyline Commercial Tower (Phase 2)</h2>
                    <p className="text-xs text-slate-400 mt-1">Budget: $12.4M • Location: Austin Tech Corridor</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> On Schedule (64%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Total Manpower Onsite</p>
                    <p className="text-2xl font-black text-white mt-1">128 / 140</p>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> 91.4% Attendance
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Heavy Machinery Active</p>
                    <p className="text-2xl font-black text-white mt-1">14 Units</p>
                    <p className="text-[11px] text-amber-400 mt-1">2 Cranes, 4 Excavators</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">Next Milestone</p>
                    <p className="text-sm font-bold text-white mt-1">RCC Slab Pour (Lvl 14)</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Due in 3 days
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">HSE Safety Record</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">142 Days</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" /> Zero Lost Time Incidents
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Milestones */}
            {activeTab === 'milestones' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Interactive Construction Milestones</h3>
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                            {m.phase}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">{m.name}</h4>
                          <p className="text-xs text-slate-400">{m.dates}</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">
                          {m.progress}% ({m.status})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={m.progress}
                        onChange={(e) => handleProgressChange(m.id, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View 3: Machinery & Inventory */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Machinery & Material Inventory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-amber-400">Active Heavy Fleet</h4>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>Tower Crane #1 (50 Ton)</span>
                        <span className="text-emerald-400 font-bold">Active (Lvl 14)</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>Hydraulic Excavator CAT 320</span>
                        <span className="text-emerald-400 font-bold">Operational</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>Concrete Transit Mixer</span>
                        <span className="text-amber-400 font-bold">In Transit</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-sky-400">Inventory Stocks</h4>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>Portland Cement Grade 53</span>
                        <span className="font-bold text-white">1,450 Bags</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>TMT Steel Rebar (16mm)</span>
                        <span className="font-bold text-white">42 Tons</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-800 pb-1">
                        <span>M25 Ready-Mix Concrete</span>
                        <span className="font-bold text-white">320 m³</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* View 4: Workforce */}
            {activeTab === 'workforce' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Workforce Turnstile Check-In</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th className="pb-2">Worker Name</th>
                        <th className="pb-2">Trade / Role</th>
                        <th className="pb-2">Shift</th>
                        <th className="pb-2">Turnstile Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2.5 font-bold text-white">Ravi Kumar</td>
                        <td className="py-2.5">Structural Barbender</td>
                        <td className="py-2.5">Morning (07:00 - 15:30)</td>
                        <td className="py-2.5 text-emerald-400 font-bold">✓ Present (06:52 AM)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-white">David Miller</td>
                        <td className="py-2.5">Crane Operator L3</td>
                        <td className="py-2.5">Morning (07:00 - 15:30)</td>
                        <td className="py-2.5 text-emerald-400 font-bold">✓ Present (06:45 AM)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}