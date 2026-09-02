import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Truck, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  FolderPlus, 
  Check, 
  ChevronRight, 
  ArrowUpRight, 
  Plus, 
  ShieldAlert, 
  Hammer, 
  Wrench, 
  RefreshCw, 
  UserCheck, 
  HardHat, 
  LogOut, 
  Mail, 
  Lock, 
  Sparkles, 
  Activity, 
  ClipboardCheck, 
  Compass, 
  SlidersHorizontal 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';

// Initial Milestone Data
const initialMilestones = [
  {
    id: 'm1',
    title: 'Site Preparation & Excavation',
    phase: 'Phase 1 - Groundwork',
    progress: 100,
    targetDate: '2026-03-15',
    status: 'Completed',
    lead: 'Dave K. (Site Eng)',
    budgetUtilized: '$420,000 / $420,000',
  },
  {
    id: 'm2',
    title: 'Foundation & Deep Sub-Structure Piling',
    phase: 'Phase 1 - Groundwork',
    progress: 100,
    targetDate: '2026-05-10',
    status: 'Completed',
    lead: 'Marcus V. (PM)',
    budgetUtilized: '$1,850,000 / $1,900,000',
  },
  {
    id: 'm3',
    title: 'Structural Steel & Reinforced Concrete (RCC) Frame',
    phase: 'Phase 2 - Core Superstructure',
    progress: 75,
    targetDate: '2026-10-30',
    status: 'In Progress',
    lead: 'Dave K. (Site Eng)',
    budgetUtilized: '$3,100,000 / $4,200,000',
  },
  {
    id: 'm4',
    title: 'MEP (Mechanical, Electrical & Plumbing) Rough-in',
    phase: 'Phase 3 - Utilities & Enclosure',
    progress: 40,
    targetDate: '2027-01-20',
    status: 'In Progress',
    lead: 'Elena R. (Contractor)',
    budgetUtilized: '$850,000 / $2,100,000',
  },
  {
    id: 'm5',
    title: 'Exterior Curtain Wall Glazing & Facade',
    phase: 'Phase 3 - Utilities & Enclosure',
    progress: 15,
    targetDate: '2027-04-15',
    status: 'Pending',
    lead: 'Elena R. (Contractor)',
    budgetUtilized: '$200,000 / $1,600,000',
  },
  {
    id: 'm6',
    title: 'Interior Drywall & Architectural Finishing',
    phase: 'Phase 4 - Interior Fit-out',
    progress: 0,
    targetDate: '2027-07-30',
    status: 'Pending',
    lead: 'Elena R. (Contractor)',
    budgetUtilized: '$0 / $1,400,000',
  },
  {
    id: 'm7',
    title: 'Final Commissioning, Fire Safety & Handover Audit',
    phase: 'Phase 5 - Closeout & Handover',
    progress: 0,
    targetDate: '2027-09-15',
    status: 'Pending',
    lead: 'Sarah J. (Lead Auditor)',
    budgetUtilized: '$0 / $350,000',
  },
];

// Machinery Equipment List
const initialMachinery = [
  { id: 'EQ-101', name: 'Liebherr 280 EC-H Tower Crane', type: 'Heavy Lifting', status: 'Operational', operator: 'Sam Wilson', hoursLogged: '1,420 hrs' },
  { id: 'EQ-102', name: 'CAT 320 Hydraulic Excavator', type: 'Earthmoving', status: 'Operational', operator: 'Raj Patel', hoursLogged: '860 hrs' },
  { id: 'EQ-103', name: 'Schwing Stetter Concrete Boom Pump', type: 'Pumping', status: 'Maintenance', operator: 'Carlos Mendez', hoursLogged: '640 hrs' },
  { id: 'EQ-104', name: 'Volvo A40G Articulated Hauler', type: 'Hauling', status: 'Operational', operator: 'Liam Chen', hoursLogged: '910 hrs' },
  { id: 'EQ-105', name: 'GenSet 500kVA Standby Power', type: 'Power Utility', status: 'Operational', operator: 'Autonomous', hoursLogged: '2,150 hrs' },
];

// Material Inventory Stocks
const initialMaterials = [
  { item: 'TMT Steel Rebar (Fe 500D)', category: 'Structural', stock: '185 MT', threshold: '50 MT', status: 'Adequate' },
  { item: 'OPC 53 Grade Cement', category: 'Civil', stock: '2,400 Bags', threshold: '500 Bags', status: 'Adequate' },
  { item: 'M25 Ready Mix Concrete (RMC)', category: 'Civil', stock: '140 m³', threshold: '80 m³', status: 'Low Stock' },
  { item: 'AAC Masonry Blocks (600x200x150)', category: 'Masonry', stock: '8,200 Pcs', threshold: '2,000 Pcs', status: 'Adequate' },
  { item: 'Conduit PVC Pipes 25mm', category: 'MEP Electrical', stock: '1,200 Mtr', threshold: '300 Mtr', status: 'Adequate' },
];

// Workforce Attendance Logs
const initialAttendance = [
  { trade: 'Rebar & Steel Fixing Crew', headCount: 42, onSite: 40, shift: 'Morning (07:00 - 15:30)', supervisor: 'Master Mason J. Vance' },
  { trade: 'Concrete Formwork & Shuttering', headCount: 35, onSite: 34, shift: 'Morning (07:00 - 15:30)', supervisor: 'Chief Carpenter M. Ross' },
  { trade: 'MEP Utility Specialists', headCount: 18, onSite: 18, shift: 'Morning (08:00 - 16:30)', supervisor: 'Eng. K. Nair' },
  { trade: 'Tower Crane & Heavy Rigging Operators', headCount: 8, onSite: 8, shift: 'Continuous Rotational', supervisor: 'Safety Chief T. Gomez' },
  { trade: 'Site Survey & Quality Assurance', headCount: 6, onSite: 6, shift: 'General (08:30 - 17:00)', supervisor: 'Dave K. (Site Eng)' },
];

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register' | 'forgot'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [selectedRole, setSelectedRole] = useState('PROJECT_MANAGER');
  const [authMessage, setAuthMessage] = useState('');

  // Dashboard Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milestones' | 'resources' | 'workforce'

  // Application Data States
  const [milestones, setMilestones] = useState(initialMilestones);
  const [machinery] = useState(initialMachinery);
  const [materials] = useState(initialMaterials);
  const [attendance] = useState(initialAttendance);
  const [notification, setNotification] = useState('');

  // 1-Click Persona Login Handler
  const handleQuickLogin = (role, name, email) => {
    setCurrentUser({
      name,
      email,
      role,
      token: `jwt-token-${role.toLowerCase()}-${Date.now()}`,
    });
    setAuthMessage('');
  };

  // Standard Form Authentication Handler
  const handleFormAuth = (e) => {
    e.preventDefault();
    if (authMode === 'signin') {
      if (!authEmail || !authPassword) {
        setAuthMessage('Please enter valid email and password.');
        return;
      }
      setCurrentUser({
        name: authEmail.split('@')[0],
        email: authEmail,
        role: selectedRole,
        token: `jwt-${Date.now()}`,
      });
    } else if (authMode === 'register') {
      if (!authName || !authEmail || !authPassword) {
        setAuthMessage('All registration fields are required.');
        return;
      }
      setCurrentUser({
        name: authName,
        email: authEmail,
        role: selectedRole,
        token: `jwt-${Date.now()}`,
      });
    } else {
      setAuthMessage('Password recovery link dispatched to your email.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthMessage('');
  };

  // Milestone Progress Update Handler
  const handleProgressChange = (id, newProgress) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const progress = Number(newProgress);
          let status = 'In Progress';
          if (progress === 100) status = 'Completed';
          if (progress === 0) status = 'Pending';
          return { ...m, progress, status };
        }
        return m;
      })
    );
    setNotification('Milestone progress recalculated successfully.');
    setTimeout(() => setNotification(''), 3000);
  };

  // Calculate Global Project Completion
  const overallProgress = Math.round(
    milestones.reduce((acc, curr) => acc + curr.progress, 0) / milestones.length
  );

  // IF NOT AUTHENTICATED -> SHOW MULTI-ROLE AUTH SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Brand & Overview Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <HardHat className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Build<span className="text-amber-400">Track</span>
                </h1>
                <p className="text-xs font-semibold text-slate-400">Construction Management & Field Ops</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Enterprise Multi-Role <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  Project Workspace
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Streamlining milestone governance, equipment telemetry, labor attendance, and role-based site audits for high-density infrastructure projects.
              </p>
            </div>

            {/* Quick 1-Click Persona Switcher */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> 1-Click Persona Access (Milestone 1 Test)
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">6 Roles</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickLogin('PROJECT_MANAGER', 'Marcus Vance', 'marcus.pm@buildtrack.io')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Project Manager</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">Marcus Vance</p>
                </button>

                <button
                  onClick={() => handleQuickLogin('SITE_ENGINEER', 'Dave K.', 'dave.eng@buildtrack.io')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Site Engineer</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">Dave K.</p>
                </button>

                <button
                  onClick={() => handleQuickLogin('CONTRACTOR', 'Elena Ramos', 'elena.cont@buildtrack.io')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Contractor</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">Elena Ramos</p>
                </button>

                <button
                  onClick={() => handleQuickLogin('ADMINISTRATOR', 'Admin Root', 'admin@buildtrack.io')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Administrator</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">System Admin</p>
                </button>

                <button
                  onClick={() => handleQuickLogin('SITE_WORKER', 'Sam Wilson', 'sam.worker@buildtrack.io')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Site Worker</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">Field Crew</p>
                </button>

                <button
                  onClick={() => handleQuickLogin('CLIENT', 'Apex Capital Partners', 'investor@apexcap.com')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-left transition-all border border-slate-700/60 group cursor-pointer"
                >
                  <p className="text-xs font-bold truncate">Client / Investor</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-900">Apex Holdings</p>
                </button>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex border-b border-slate-800 pb-3 gap-6">
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`text-sm font-bold pb-2 transition-all cursor-pointer ${
                    authMode === 'signin' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`text-sm font-bold pb-2 transition-all cursor-pointer ${
                    authMode === 'register' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register Account
                </button>
                <button
                  onClick={() => setAuthMode('forgot')}
                  className={`text-sm font-bold pb-2 transition-all cursor-pointer ${
                    authMode === 'forgot' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Forgot Password
                </button>
              </div>

              {authMessage && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authMessage}</span>
                </div>
              )}

              <form onSubmit={handleFormAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Marcus Vance"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="engineer@buildtrack.io"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {authMode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {authMode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stakeholder Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="PROJECT_MANAGER">Project Manager (Full Oversight)</option>
                      <option value="SITE_ENGINEER">Site Engineer (Field Log & Milestones)</option>
                      <option value="CONTRACTOR">Contractor (MEP & Material Requisitions)</option>
                      <option value="ADMINISTRATOR">Administrator (Security & Permissions)</option>
                      <option value="SITE_WORKER">Site Worker (Attendance & Tasks)</option>
                      <option value="CLIENT">Client / Investor (Audit & Progress)</option>
                    </select>
                  </div>
                )}

                <Button type="submit" variant="primary" className="w-full py-3 mt-2">
                  {authMode === 'signin' && 'Authenticate & Enter Workspace'}
                  {authMode === 'register' && 'Create Project Stakeholder Account'}
                  {authMode === 'forgot' && 'Send Password Recovery Email'}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD WORKSPACE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Modules</p>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Project Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'milestones' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Milestone Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'resources' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Machinery & Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('workforce')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'workforce' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Workforce Attendance</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold block">Logged-in Persona</span>
            <p className="text-xs font-black text-amber-400 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{currentUser.role}</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Notification Toast */}
          {notification && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* TAB 1: PROJECT OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Header Stats Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Project Phase: Superstructure</span>
                  <h2 className="text-2xl font-black text-white mt-1">Skyline Commercial Tower - Phase II</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Plot 42, Financial District • Lead Contractor: Vertex Infra</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
                    <p className="text-[10px] text-slate-400 font-semibold">Total Budget</p>
                    <p className="text-sm font-extrabold text-white">$12,420,000</p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right">
                    <p className="text-[10px] text-amber-400 font-semibold">Overall Progress</p>
                    <p className="text-sm font-black text-amber-400">{overallProgress}%</p>
                  </div>
                </div>
              </div>

              {/* 4 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Milestones Completed</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-white">
                    {milestones.filter((m) => m.progress === 100).length} / {milestones.length}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold">2 Critical phases signed off</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Active Fleet Dispatched</span>
                    <Truck className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-white">4 / 5 Units</p>
                  <p className="text-[10px] text-amber-400 font-semibold">1 unit under preventive maintenance</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Labor On-Site Today</span>
                    <Users className="h-4 w-4 text-sky-400" />
                  </div>
                  <p className="text-2xl font-black text-white">106 Active</p>
                  <p className="text-[10px] text-sky-400 font-semibold">97.2% turnstile biometric turnout</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Safety Record</span>
                    <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-black text-white">142 Days</p>
                  <p className="text-[10px] text-indigo-400 font-semibold">Zero lost-time injuries (LTI)</p>
                </div>
              </div>

              {/* Progress Bar & Quick Action */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Consolidated Milestone Completion</h3>
                  <span className="text-xs font-extrabold text-amber-400">{overallProgress}% Total Execution</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {milestones.slice(0, 4).map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <p className="text-[11px] font-bold text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{m.progress}% • {m.status}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MILESTONE TRACKER */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Interactive Milestone & Phase Tracker</h2>
                  <p className="text-xs text-slate-400">Adjust phase execution sliders to update real-time site milestones</p>
                </div>
                <Button variant="secondary" onClick={() => setNotification('Exported Milestone Audit Log.')}>
                  Export Audit Log
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{m.phase}</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{m.title}</h4>
                        <p className="text-xs text-slate-400">Target Date: {m.targetDate} • Lead: {m.lead}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">{m.budgetUtilized}</span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            m.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : m.status === 'In Progress'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Progress Slider */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Execution Slider:</span>
                        <span className="text-amber-400 font-mono">{m.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={m.progress}
                        onChange={(e) => handleProgressChange(m.id, e.target.value)}
                        className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MACHINERY & INVENTORY */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              
              {/* Heavy Machinery */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-400" /> Heavy Machinery Telemetry
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Asset ID</th>
                        <th className="p-3.5">Equipment Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Operator</th>
                        <th className="p-3.5">Hours</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {machinery.map((eq) => (
                        <tr key={eq.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-amber-400 font-bold">{eq.id}</td>
                          <td className="p-3.5 font-bold text-white">{eq.name}</td>
                          <td className="p-3.5 text-slate-400">{eq.type}</td>
                          <td className="p-3.5 text-slate-300">{eq.operator}</td>
                          <td className="p-3.5 font-mono text-slate-400">{eq.hoursLogged}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                eq.status === 'Operational'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {eq.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw Material Inventory */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-400" /> Raw Materials & Site Inventory
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Material Item</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Current Stock</th>
                        <th className="p-3.5">Reorder Threshold</th>
                        <th className="p-3.5">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {materials.map((mat, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-white">{mat.item}</td>
                          <td className="p-3.5 text-slate-400">{mat.category}</td>
                          <td className="p-3.5 font-mono font-bold text-white">{mat.stock}</td>
                          <td className="p-3.5 font-mono text-slate-500">{mat.threshold}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mat.status === 'Adequate'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {mat.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: WORKFORCE ATTENDANCE */}
          {activeTab === 'workforce' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Turnstile Biometric Labor Attendance</h2>
                  <p className="text-xs text-slate-400">Daily real-time site headcounts categorized by trade & shift</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">
                  Total On-Site: 106 Workers
                </div>
              </div>

              <div className="space-y-3">
                {attendance.map((att, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{att.trade}</h4>
                      <p className="text-xs text-slate-400">Supervisor: {att.supervisor} • Shift: {att.shift}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Attendance</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {att.onSite} / {att.headCount} Present
                        </span>
                      </div>
                      <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${(att.onSite / att.headCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
