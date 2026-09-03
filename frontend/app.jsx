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
  Building2,
  Filter,
  Plus,
  Download,
  Eye,
  Truck,
  HardHat,
  RefreshCw,
  Check
} from 'lucide-react';

export default function App() {
  // ================= 1. AUTHENTICATION =================
  const [currentUser, setCurrentUser] = useState(null); // null = Login Page
  const [loginEmail, setLoginEmail] = useState('admin@buildtrack.io');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginRole, setLoginRole] = useState('Administrator');
  const [authError, setAuthError] = useState('');

  // ================= 2. DASHBOARD & NAVIGATION =================
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZeroData, setIsZeroData] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateProj, setShowCreateProj] = useState(false);

  // ================= 3. RICH DATA FOR ALL PAGES =================
  // 10-Slot Dynamic Booking concept for Mentor
  const [slots, setSlots] = useState([
    'live-booked', 'live-booked', 'pre-booking', 'empty', 'empty',
    'empty', 'empty', 'empty', 'empty', 'empty'
  ]);

  // Projects Data
  const [projectsList, setProjectsList] = useState([
    { id: 'PRJ-101', name: 'Helix Commercial Tower', location: 'Metro Zone A', budget: '$4,200,000', progress: 74, status: 'On Track', manager: 'Marcus Vance' },
    { id: 'PRJ-102', name: 'Riverfront Residences Phase 2', location: 'Riverside Blvd', budget: '$6,800,000', progress: 42, status: 'Delayed', manager: 'Elena Rostova' },
    { id: 'PRJ-103', name: 'Greenfield Eco-Hospital', location: 'Sector 9 West', budget: '$12,500,000', progress: 18, status: 'At Risk', manager: 'David Miller' },
    { id: 'PRJ-104', name: 'Silicon Valley Logistics Hub', location: 'Interstate Hub 4', budget: '$3,100,000', progress: 95, status: 'Completed', manager: 'Aisha Patel' },
    { id: 'PRJ-105', name: 'Skyline Metro Station', location: 'Central Junction', budget: '$8,900,000', progress: 58, status: 'On Track', manager: 'James Chen' }
  ]);

  // Inventory Data
  const [inventoryList, setInventoryList] = useState([
    { id: 'MAT-01', item: 'Portland Cement (Grade 53)', category: 'Raw Materials', inStock: 840, unit: 'Bags', minReq: 200, status: 'Adequate' },
    { id: 'MAT-02', item: 'TMT Steel Rebars (16mm)', category: 'Metals & Structural', inStock: 42, unit: 'Tons', minReq: 50, status: 'Low Stock' },
    { id: 'MAT-03', item: 'Ready-Mix Concrete (M30)', category: 'Concrete', inStock: 120, unit: 'm³', minReq: 30, status: 'Adequate' },
    { id: 'MAT-04', item: 'Safety Helmets & Vests', category: 'PPE Safety', inStock: 18, unit: 'Units', minReq: 100, status: 'Critical' },
    { id: 'MAT-05', item: 'River Sand (Washed)', category: 'Aggregates', inStock: 350, unit: 'Tons', minReq: 150, status: 'Adequate' }
  ]);

  // Resources (Heavy Equipment & Machinery)
  const [resourcesList, setResourcesList] = useState([
    { id: 'EQ-01', name: 'Tower Crane Liebherr 280 EC-H', type: 'Lifting', status: 'Operational', operator: 'Vikram Singh', site: 'Helix Tower' },
    { id: 'EQ-02', name: 'CAT 336 Hydraulic Excavator', type: 'Earthmoving', status: 'In Maintenance', operator: 'Unassigned', site: 'Riverfront' },
    { id: 'EQ-03', name: 'Volvo FMX Concrete Mixer', type: 'Haulage', status: 'Operational', operator: 'Rajesh Nair', site: 'Greenfield' },
    { id: 'EQ-04', name: 'JCB 4DX Backhoe Loader', type: 'Earthmoving', status: 'Operational', operator: 'Sunil Verma', site: 'Metro Station' }
  ]);

  // Workforce Data
  const [workforceList, setWorkforceList] = useState([
    { id: 'W-101', name: 'Ramesh Sharma', trade: 'Foreman', project: 'Helix Tower', shift: 'Morning (07:00 - 15:30)', status: 'Present' },
    { id: 'W-102', name: 'Arun Patel', trade: 'Master Electrician', project: 'Greenfield', shift: 'Morning (07:00 - 15:30)', status: 'Present' },
    { id: 'W-103', name: 'Praveen Yadav', trade: 'Structural Welder', project: 'Helix Tower', shift: 'Night (22:00 - 06:00)', status: 'On Leave' },
    { id: 'W-104', name: 'Karthik Rao', trade: 'Safety Officer', project: 'Riverfront', shift: 'Morning (07:00 - 15:30)', status: 'Present' }
  ]);

  // Procurement Requests
  const [procurementsList, setProcurementsList] = useState([
    { id: 'PO-8821', item: 'Structural Steel Beams (20T)', requestedBy: 'Marcus Vance', amount: '$42,800', date: '24 Aug 2026', status: 'Pending Approval' },
    { id: 'PO-8820', item: 'Safety Harnesses & Lanyards (50 pcs)', requestedBy: 'Karthik Rao', amount: '$4,200', date: '23 Aug 2026', status: 'Approved' },
    { id: 'PO-8819', item: 'Diesel Fuel for Generators (5000L)', requestedBy: 'Site Ops', amount: '$7,500', date: '21 Aug 2026', status: 'Delivered' }
  ]);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail) {
      setAuthError('Please enter an email.');
      return;
    }
    const namePart = loginEmail.split('@')[0];
    const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setCurrentUser({
      name: cleanName,
      email: loginEmail,
      role: loginRole,
      initials: cleanName.substring(0, 2).toUpperCase()
    });
    showNotification(`Welcome back, ${cleanName}!`);
  };

  const handleQuickLogin = (name, email, role, initials) => {
    setCurrentUser({ name, email, role, initials });
    showNotification(`Logged in as ${name} (${role})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowProfileMenu(false);
    setActiveView('dashboard');
    showNotification('Logged out successfully.');
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

  // Sidebar Menu Sections
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
  // VIEW 1: LOGIN SCREEN (if not logged in)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans">
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold">{toast}</span>
          </div>
        )}

        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-md mb-2">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">BUILDTRACK</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase">Project Management & Construction ERP</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-1">Select your role or enter credentials to proceed.</p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="user@buildtrack.io"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Administrator">Administrator (Super Admin)</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Site Engineer">Site Engineer</option>
                    <option value="Contractor">Contractor / Subcontractor</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Quick 1-Click Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickLogin('Rohitha', 'rohitha@buildtrack.io', 'Administrator', 'RM')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 text-left"
                >
                  <p className="text-xs font-bold text-slate-800">Rohitha M.</p>
                  <p className="text-[10px] text-slate-500">Administrator</p>
                </button>
                <button
                  onClick={() => handleQuickLogin('Marcus Vance', 'marcus@buildtrack.io', 'Project Manager', 'MV')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 text-left"
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
  // VIEW 2: FULL APPLICATION AFTER LOGIN
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl">
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
              {activeView === 'dashboard' ? `${currentUser.role} Workspace` : activeView.replace('-', ' ').toUpperCase()}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, inventory..."
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

          {/* User Profile */}
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
                  <span>Settings</span>
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

      {/* BODY WITH SIDEBAR & ALL REAL PAGES */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 px-3">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">BUILDTRACK</h1>
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">CONSTRUCTION ERP</p>
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

        {/* MAIN DISPLAY AREA: FULL PAGES */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* ================= PAGE 1: DASHBOARD ================= */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      Welcome back, {currentUser.name}! <span>👋</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Here is your live construction management overview.</p>
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
                      <span>{isZeroData ? 'Zero-Data (Active)' : 'Simulate Zero-Data'}</span>
                    </button>
                  </div>
                </div>

                {/* 5 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-500">TOTAL USERS</span>
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 256}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3.5 w-3.5" /> 17% from last month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-500">TOTAL PROJECTS</span>
                      <FolderKanban className="h-4 w-4 text-sky-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 48}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3.5 w-3.5" /> 8% from last month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-500">ACTIVE PROJECTS</span>
                      <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 32}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3.5 w-3.5" /> 15% from last month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-500">PENDING APPROVALS</span>
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 14}</p>
                    <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <ArrowDownRight className="h-3.5 w-3.5" /> 5% from last month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-500">SYSTEM ALERTS</span>
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{isZeroData ? 0 : 7}</p>
                    <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <ArrowDownRight className="h-3.5 w-3.5" /> 12% from last month
                    </p>
                  </div>
                </div>

                {/* 10-Slot Dynamic Booking Matrix (Mentor requirement) */}
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
            )}

            {/* ================= PAGE 2: PROJECTS ================= */}
            {activeView === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Projects Directory</h2>
                    <p className="text-xs text-slate-500">Track progress, budget, and active sites</p>
                  </div>
                  <button
                    onClick={() => setShowCreateProj(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700"
                  >
                    <Plus className="h-4 w-4" /> New Project
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsList.map((p) => (
                    <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{p.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'Delayed' ? 'bg-amber-100 text-amber-700' :
                          p.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}>{p.status}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">📍 {p.location} • Lead: {p.manager}</p>
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>Progress</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center text-xs">
                        <span className="text-slate-500">Budget: <strong>{p.budget}</strong></span>
                        <button
                          onClick={() => {
                            setActiveView('site-progress');
                            showNotification(`Viewing milestones for ${p.name}`);
                          }}
                          className="text-amber-700 font-bold hover:underline"
                        >
                          View Site →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 3: SITE PROGRESS ================= */}
            {activeView === 'site-progress' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Site Progress & Milestones</h2>
                  <p className="text-xs text-slate-500">Live milestones for Helix Commercial Tower (Phase 3)</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  {[
                    { phase: 'Phase 1: Foundation & Excavation', progress: 100, status: 'Completed', deadline: '15 Jan 2026' },
                    { phase: 'Phase 2: Substructure & Basement Parking', progress: 100, status: 'Completed', deadline: '28 Feb 2026' },
                    { phase: 'Phase 3: Superstructure (Floors 1-15)', progress: 74, status: 'In Progress', deadline: '30 Oct 2026' },
                    { phase: 'Phase 4: MEP Electrical & Plumbing', progress: 35, status: 'Active', deadline: '15 Dec 2026' },
                    { phase: 'Phase 5: Facade Glazing & Interior Handover', progress: 0, status: 'Pending', deadline: '28 Mar 2027' }
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">{m.phase}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.progress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{m.status}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${m.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Target Deadline: {m.deadline}</span>
                        <span>{m.progress}% Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 4: RESOURCES ================= */}
            {activeView === 'resources' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Machinery & Equipment Tracking</h2>
                    <p className="text-xs text-slate-500">Heavy equipment allocation across construction sites</p>
                  </div>
                  <button onClick={() => showNotification('Equipment deployment modal opened')} className="px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700">
                    + Allocate Resource
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourcesList.map((r) => (
                    <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{r.id} • {r.type}</span>
                        <h3 className="font-bold text-sm text-slate-900">{r.name}</h3>
                        <p className="text-xs text-slate-500">Assigned: <strong>{r.site}</strong></p>
                        <p className="text-xs text-slate-500">Certified Operator: {r.operator}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === 'Operational' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 5: INVENTORY ================= */}
            {activeView === 'inventory' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Material Inventory</h2>
                    <p className="text-xs text-slate-500">Warehouse stocks and re-order thresholds</p>
                  </div>
                  <button onClick={() => showNotification('Stock replenishment recorded!')} className="px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700">
                    + Receive Stock
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Material Item</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Current Stock</th>
                        <th className="p-3">Min Required</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-500">{item.id}</td>
                          <td className="p-3 font-bold text-slate-900">{item.item}</td>
                          <td className="p-3 text-slate-500">{item.category}</td>
                          <td className="p-3 font-bold">{item.inStock} {item.unit}</td>
                          <td className="p-3 text-slate-500">{item.minReq} {item.unit}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Adequate' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= PAGE 6: WORKFORCE ================= */}
            {activeView === 'workforce' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Workforce & Site Crews</h2>
                    <p className="text-xs text-slate-500">Personnel, attendance & shift assignments</p>
                  </div>
                  <button onClick={() => setShowAddUser(true)} className="px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700">
                    + Register Worker
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {workforceList.map((w) => (
                    <div key={w.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400">{w.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {w.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                      <p className="text-xs text-amber-800 font-semibold">{w.trade}</p>
                      <p className="text-[11px] text-slate-500">Site: {w.project}</p>
                      <p className="text-[11px] text-slate-400">{w.shift}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 7: PROCUREMENT ================= */}
            {activeView === 'procurement' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Purchase Orders & Procurement</h2>
                    <p className="text-xs text-slate-500">Material requisitions and vendor authorizations</p>
                  </div>
                  <button onClick={() => showNotification('Purchase order initiated')} className="px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700">
                    + New Purchase Order
                  </button>
                </div>

                <div className="space-y-3">
                  {procurementsList.map((po) => (
                    <div key={po.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400">{po.id} • {po.date}</span>
                        <h4 className="font-bold text-sm text-slate-900">{po.item}</h4>
                        <p className="text-xs text-slate-500">Requested by: {po.requestedBy} • Budget: <strong>{po.amount}</strong></p>
                      </div>
                      <div>
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          po.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          po.status === 'Delivered' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 8: REPORTS ================= */}
            {activeView === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Compliance & Daily Reports</h2>
                    <p className="text-xs text-slate-500">Site diaries, QA/QC tests, and incident records</p>
                  </div>
                  <button onClick={() => showNotification('Comprehensive PDF Report generated!')} className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800">
                    <Download className="h-4 w-4" /> Download PDF Audit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Daily Site Diary', date: 'Today, 25 Aug 2026', items: '42 Active Workers • 2 Cranes Operational' },
                    { title: 'Concrete Cube Strength Report', date: 'Yesterday, 24 Aug 2026', items: 'Grade M30: 31.4 N/mm² (Passed QA/QC)' },
                    { title: 'Weekly EHS Safety Audit', date: '21 Aug 2026', items: '0 Lost Time Incidents • 100% PPE Adherence' }
                  ].map((r, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <FileText className="h-6 w-6 text-amber-600" />
                      <h4 className="font-bold text-sm text-slate-900">{r.title}</h4>
                      <p className="text-[11px] text-slate-400">{r.date}</p>
                      <p className="text-xs text-slate-600">{r.items}</p>
                      <button onClick={() => showNotification(`Opened ${r.title}`)} className="text-xs text-amber-700 font-bold hover:underline pt-2 inline-block">
                        View Report →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 9: ANALYTICS ================= */}
            {activeView === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">System Analytics & Forecasting</h2>
                  <p className="text-xs text-slate-500">Resource utilization, burn rate, and schedule variance</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-sm">Monthly Expenditure vs Forecast</h3>
                    <span className="text-xs text-slate-400">USD Millions</span>
                  </div>
                  <div className="h-44 flex items-end justify-between gap-4 pt-4 px-6">
                    {[
                      { month: 'Apr', value: 45, actual: 42 },
                      { month: 'May', value: 65, actual: 68 },
                      { month: 'Jun', value: 80, actual: 78 },
                      { month: 'Jul', value: 92, actual: 95 },
                      { month: 'Aug', value: 70, actual: 64 }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="flex items-end gap-1.5 w-full justify-center">
                          <div className="w-5 bg-amber-500 rounded-t-md" style={{ height: `${bar.actual * 1.5}px` }} />
                          <div className="w-5 bg-slate-200 rounded-t-md" style={{ height: `${bar.value * 1.5}px` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{bar.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-6 text-xs pt-2">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 bg-amber-500 rounded" /><span>Actual Spend</span></div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 bg-slate-200 rounded" /><span>Budget Forecast</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 10: NOTIFICATIONS ================= */}
            {activeView === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">System Notifications</h2>
                  <p className="text-xs text-slate-500">Alerts, threshold warnings, and approval requests</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
                  {[
                    { title: 'Material Re-Order Alert', msg: 'TMT Steel Rebars (16mm) stock dropped below minimum threshold (42 / 50 Tons).', time: '12m ago', type: 'warning' },
                    { title: 'PO Approval Required', msg: 'Marcus Vance submitted Purchase Order PO-8821 for $42,800.', time: '1h ago', type: 'info' },
                    { title: 'Equipment Inspection Cleared', msg: 'Liebherr 280 EC-H Tower Crane passed certified load testing.', time: '3h ago', type: 'success' }
                  ].map((n, i) => (
                    <div key={i} className="p-4 flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600">{n.msg}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PAGE 11: SETTINGS ================= */}
            {activeView === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Workspace Settings</h2>
                  <p className="text-xs text-slate-500">Manage your system credentials and preferences</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">User Name</label>
                    <input type="text" readOnly value={currentUser.name} className="w-full bg-slate-50 border p-2 text-xs rounded-xl text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Permission</label>
                    <input type="text" readOnly value={currentUser.role} className="w-full bg-slate-50 border p-2 text-xs rounded-xl text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Environment</label>
                    <p className="text-xs text-slate-500">Vite React Single Page Application (BuildTrack Enterprise v2.4)</p>
                  </div>
                  <button onClick={() => showNotification('Settings updated!')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal: Add User */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">Register Site Worker</h3>
              <button onClick={() => setShowAddUser(false)}><X className="h-4 w-4" /></button>
            </div>
            <input type="text" placeholder="Worker Full Name" className="w-full border p-2 text-xs rounded-xl" />
            <input type="text" placeholder="Trade (e.g. Electrician, Welder)" className="w-full border p-2 text-xs rounded-xl" />
            <button
              onClick={() => {
                setShowAddUser(false);
                showNotification('Worker registered and badge generated!');
              }}
              className="w-full bg-amber-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              Confirm Registration
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {showCreateProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">Initialize New Project</h3>
              <button onClick={() => setShowCreateProj(false)}><X className="h-4 w-4" /></button>
            </div>
            <input type="text" placeholder="Project Name (e.g. Sapphire Towers)" className="w-full border p-2 text-xs rounded-xl" />
            <input type="text" placeholder="Location" className="w-full border p-2 text-xs rounded-xl" />
            <input type="text" placeholder="Total Budget ($)" className="w-full border p-2 text-xs rounded-xl" />
            <button
              onClick={() => {
                setShowCreateProj(false);
                showNotification('Project initialized in database!');
              }}
              className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              Launch Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}