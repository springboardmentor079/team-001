import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Wrench,
  Boxes,
  Users,
  ShoppingCart,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Settings,
  Menu,
  Search,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  UserPlus,
  FolderPlus,
  FileText,
  Sliders,
  CheckCircle2,
  X,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  LogOut,
  Building2
} from 'lucide-react';

export default function App() {
  // ================= AUTHENTICATION STATE =================
  const [currentUser, setCurrentUser] = useState(null); // null means logged out
  const [loginEmail, setLoginEmail] = useState('admin@buildtrack.io');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginRole, setLoginRole] = useState('Administrator');
  const [authError, setAuthError] = useState('');

  // ================= DASHBOARD STATES =================
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZeroData, setIsZeroData] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // 10-Slot Dynamic Booking Concept
  const [slots, setSlots] = useState([
    'live-booked', 'live-booked', 'pre-booking', 'empty', 'empty',
    'empty', 'empty', 'empty', 'empty', 'empty'
  ]);

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateProj, setShowCreateProj] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setAuthError('');
    // Create user session from the input
    const displayName = loginEmail.split('@')[0];
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    
    setCurrentUser({
      name: formattedName,
      email: loginEmail,
      role: loginRole,
      initials: formattedName.substring(0, 2).toUpperCase()
    });

    showNotification(`Welcome back, ${formattedName}!`);
  };

  // Quick 1-Click Persona Login for fast testing
  const handleQuickLogin = (name, email, role, initials) => {
    setCurrentUser({ name, email, role, initials });
    showNotification(`Logged in as ${name} (${role})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowProfileMenu(false);
    setActiveView('dashboard');
    showNotification('You have logged out successfully.');
  };

  const handleSlotClick = (index) => {
    setSlots((prev) => {
      const copy = [...prev];
      if (copy[index] === 'empty') copy[index] = 'pre-booking';
      else if (copy[index] === 'pre-booking') copy[index] = 'live-booked';
      else copy[index] = 'empty';
      return copy;
    });
  };

  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'site-progress', label: 'Site Progress', icon: CheckSquare }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'resources', label: 'Resources', icon: Wrench },
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'workforce', label: 'Workforce', icon: Users },
        { id: 'procurement', label: 'Procurement', icon: ShoppingCart }
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  // =========================================================================
  // 1. IF NOT LOGGED IN -> RENDER THE LOGIN PAGE
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold">{toast}</span>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-md mb-2">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">BUILDTRACK</h1>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase mt-0.5">
              Project Management & Construction ERP
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign in to your workspace</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access system resources.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@buildtrack.io"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Access Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="Administrator">Administrator (All Access)</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Site Engineer">Site Engineer</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded text-amber-600 focus:ring-amber-500" />
                  <span>Remember me</span>
                </label>
                <span className="text-amber-700 font-semibold hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Demo Login Personas */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Quick 1-Click Demo Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Rohitha', 'rohitha@buildtrack.io', 'Administrator', 'RM')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 text-left transition-all"
                >
                  <p className="text-xs font-bold text-slate-800">Rohitha M.</p>
                  <p className="text-[10px] text-slate-500">Administrator</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Marcus Vance', 'marcus@buildtrack.io', 'Project Manager', 'MV')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
                >
                  <p className="text-xs font-bold text-slate-800">Marcus Vance</p>
                  <p className="text-[10px] text-slate-500">Project Manager</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. IF LOGGED IN -> RENDER THE DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {currentUser.role} Workspace
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setActiveView('notifications')}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Profile dropdown with real logged in user */}
          <div className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl cursor-pointer hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs">
                {currentUser.initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{currentUser.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            {/* Profile Dropdown with Logout */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left font-bold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR AND MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 px-3">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">BUILDTRACK</h1>
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">PROJECT MANAGEMENT</p>
          </div>

          <div className="space-y-5">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{section.title}</p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-100/80 text-amber-900 border border-amber-300 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-amber-800' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' ? (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Welcome back, {currentUser.name}! <span>👋</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">Here's your live project management overview.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsZeroData(!isZeroData)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                      isZeroData
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>{isZeroData ? 'Zero-Data Mode (Active)' : 'Simulate Zero-Data'}</span>
                  </button>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* 5 KPI Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TOTAL USERS</span>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 256}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 17% from last month
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TOTAL PROJECTS</span>
                    <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 48}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 8% from last month
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ACTIVE PROJECTS</span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 32}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> 15% from last month
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PENDING APPROVALS</span>
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 14}</p>
                  <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-3.5 w-3.5" /> 5% from last month
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SYSTEM ALERTS</span>
                    <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 7}</p>
                  <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-3.5 w-3.5" /> 12% from last month
                  </p>
                </div>
              </div>

              {/* Charts & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Project Overview</h3>
                    <span className="text-xs text-slate-500">This Month</span>
                  </div>
                  <div className="py-4 flex items-center justify-around">
                    <div className="relative flex items-center justify-center">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                        {!isZeroData && (
                          <>
                            <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="12" strokeDasharray="100 138" fill="transparent" />
                            <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" strokeDasharray="69 169" strokeDashoffset="-100" fill="transparent" />
                            <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="12" strokeDasharray="40 198" strokeDashoffset="-169" fill="transparent" />
                            <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="12" strokeDasharray="30 208" strokeDashoffset="-209" fill="transparent" />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold">{isZeroData ? 0 : 48}</span>
                        <span className="text-[10px] text-slate-400">Total</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span>On Track: 20</span></div>
                      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /><span>Delayed: 14</span></div>
                      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" /><span>At Risk: 8</span></div>
                      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /><span>Completed: 6</span></div>
                    </div>
                  </div>
                  <button onClick={() => setActiveView('projects')} className="text-xs font-semibold text-amber-700 hover:underline text-left">
                    View all projects →
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">System Analytics</h3>
                    <span className="text-xs text-slate-500">Active Trend</span>
                  </div>
                  <div className="h-36 flex items-center justify-center">
                    {isZeroData ? (
                      <p className="text-xs text-slate-400">Zero data recorded</p>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 260 100">
                        <path d="M 10 70 Q 60 50, 120 40 T 200 20 T 250 25" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                        <path d="M 10 85 Q 60 80, 120 75 T 200 70 T 250 50" fill="none" stroke="#10b981" strokeWidth="2.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">New user verified</p>
                        <p className="text-slate-500 text-[11px]">System role assigned</p>
                      </div>
                      <span className="text-slate-400 text-[10px]">10m ago</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Project milestone cleared</p>
                        <p className="text-slate-500 text-[11px]">Helix Tower phase 2</p>
                      </div>
                      <span className="text-slate-400 text-[10px]">1h ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic 10-Slot Booking Component */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Mentor Concept</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">10-Slot Dynamic Booking & Empty State Handler</h3>
                    <p className="text-xs text-slate-500">Click any block to cycle: Empty ➔ Pre-Booking ➔ Live Booked</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSlots(Array(10).fill('empty'))}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                    >
                      Make All 10 Empty
                    </button>
                    <button
                      onClick={() => setSlots(['live-booked', 'live-booked', 'pre-booking', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'])}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900"
                    >
                      Reset Slots
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {slots.map((status, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSlotClick(idx)}
                      className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                        status === 'empty'
                          ? 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'
                          : status === 'pre-booking'
                          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                          : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400">SLOT {idx + 1}</span>
                      <div className="my-2">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          status === 'empty' ? 'bg-slate-200 text-slate-600' :
                          status === 'pre-booking' ? 'bg-amber-200 text-amber-800' :
                          'bg-emerald-200 text-emerald-800'
                        }`}>
                          {status === 'empty' && 'Empty Slot'}
                          {status === 'pre-booking' && 'Pre-Booking'}
                          {status === 'live-booked' && 'Live Booked'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Click to change</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* DEDICATED VIEW FOR OTHER SIDEBAR BUTTONS */
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-2xl mx-auto shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 capitalize">{activeView.replace('-', ' ')} Page</h2>
              <p className="text-xs text-slate-500 mt-2">
                This page is active for user: <strong>{currentUser.name}</strong> ({currentUser.role}).
              </p>
              <button
                onClick={() => setActiveView('dashboard')}
                className="mt-6 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Add User */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">Add New System User</h3>
              <button onClick={() => setShowAddUser(false)}><X className="h-4 w-4" /></button>
            </div>
            <input type="text" placeholder="Full Name" className="w-full border p-2 text-xs rounded-xl" />
            <input type="email" placeholder="Email Address" className="w-full border p-2 text-xs rounded-xl" />
            <button
              onClick={() => {
                setShowAddUser(false);
                showNotification('User created successfully!');
              }}
              className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              Confirm & Save
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {showCreateProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">Create New Project</h3>
              <button onClick={() => setShowCreateProj(false)}><X className="h-4 w-4" /></button>
            </div>
            <input type="text" placeholder="Project Name" className="w-full border p-2 text-xs rounded-xl" />
            <input type="number" placeholder="Budget" className="w-full border p-2 text-xs rounded-xl" />
            <button
              onClick={() => {
                setShowCreateProj(false);
                showNotification('Project initialized successfully!');
              }}
              className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              Initialize Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}