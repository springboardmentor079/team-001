import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Activity, 
  SlidersHorizontal,
  FolderKanban,
  ShoppingCart,
  Bell,
  UserCheck,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  Info
} from 'lucide-react';
import { Button } from '../components/Button';
import { api, formatApiError } from '../services/api';

export const Dashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [resources, setResources] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [profileData, setProfileData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMap, setErrorMap] = useState({});

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const newErrors = {};

    try {
      const p = await api.getProfile();
      setProfileData(p);
    } catch (err) {
      newErrors.profile = err.message;
    }

    try {
      const pList = await api.getProjects();
      setProjects(Array.isArray(pList) ? pList : []);
    } catch (err) {
      newErrors.projects = err.message;
    }

    try {
      const progList = await api.getProgress();
      setMilestones(Array.isArray(progList) ? progList : []);
    } catch (err) {
      newErrors.milestones = err.message;
    }

    try {
      const rData = await api.getResources();
      setResources(Array.isArray(rData?.resources) ? rData.resources : Array.isArray(rData) ? rData : []);
    } catch (err) {
      newErrors.resources = err.message;
    }

    try {
      const invData = await api.getInventory();
      setInventory(Array.isArray(invData?.inventory) ? invData.inventory : Array.isArray(invData) ? invData : []);
    } catch (err) {
      newErrors.inventory = err.message;
    }

    try {
      const wList = await api.getWorkers();
      setWorkers(Array.isArray(wList) ? wList : []);
    } catch (err) {
      newErrors.workers = err.message;
    }

    try {
      const attList = await api.getAttendance();
      setAttendance(Array.isArray(attList) ? attList : []);
    } catch (err) {
      newErrors.attendance = err.message;
    }

    try {
      const procData = await api.getProcurements();
      setProcurements(Array.isArray(procData?.procurements) ? procData.procurements : Array.isArray(procData) ? procData : []);
    } catch (err) {
      newErrors.procurements = err.message;
    }

    try {
      const nList = await api.getNotifications();
      setNotificationsList(Array.isArray(nList) ? nList : []);
    } catch (err) {
      newErrors.notifications = err.message;
    }

    setErrorMap(newErrors);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleProgressChange = async (id, newPct) => {
    const pct = Number(newPct);
    const existing = milestones.find((m) => m.id === id);
    if (!existing) return;

    let status = 'In Progress';
    if (pct === 100) status = 'Completed';
    else if (pct === 0) status = 'Pending';

    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completion_pct: pct, status } : m))
    );

    try {
      await api.updateProgress(id, {
        project_id: existing.project_id || 1,
        name: existing.name || existing.title,
        description: existing.description || '',
        due_date: existing.due_date || existing.targetDate || null,
        completed_date: pct === 100 ? new Date().toISOString().slice(0, 10) : null,
        status,
        completion_pct: pct,
      });
      showToast(`Milestone #${id} progress updated to ${pct}% in database.`);
    } catch (err) {
      showToast(`Error updating milestone in backend: ${err.message}`);
      api.getProgress().then((data) => {
        if (Array.isArray(data)) setMilestones(data);
      }).catch(() => {});
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.updateNotification(id, { is_read: true });
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      showToast('Notification marked as read.');
    } catch (err) {
      showToast(`Failed to update notification: ${err.message}`);
    }
  };

  const overallProgress = milestones.length > 0
    ? Math.round(
        milestones.reduce((acc, curr) => acc + (Number(curr.completion_pct) || 0), 0) /
        milestones.length
      )
    : 0;

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

  return (
    <div className="flex-1 flex overflow-hidden">
      {}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 hidden md:flex flex-col justify-between shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Connected Modules</p>
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Project Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'projects' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'milestones' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Milestones / Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resources' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Machinery & Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Materials & Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('workforce')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'workforce' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Workers & Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('procurement')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'procurement' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Procurement</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifications' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            {notificationsList.filter(n => !n.is_read).length > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-mono">
                {notificationsList.filter(n => !n.is_read).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Profile</span>
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={loadDashboardData}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Backend Data</span>
          </button>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold block">Authenticated Persona</span>
            <p className="text-xs font-black text-amber-400 truncate">{currentUser?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 font-mono">{(currentUser?.role || 'PROJECT MANAGER').toUpperCase()}</p>
          </div>
        </div>
      </aside>

      {}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {}
        {loading && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Synchronizing real-time data from BuildTrack Backend (http://localhost:5000)...</span>
          </div>
        )}

        {}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {projects.length > 0 ? `Active Portfolio: ${projects.length} Projects` : 'Project Portfolio'}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {projects[0]?.name || 'BuildTrack Construction Management'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {projects[0]?.location || 'Plot 42, Financial District'} • Category: {projects[0]?.category || 'Infrastructure'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
                  <p className="text-[10px] text-slate-400 font-semibold">Total Budget</p>
                  <p className="text-sm font-extrabold text-white">
                    {totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : '$0'}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right">
                  <p className="text-[10px] text-amber-400 font-semibold">Milestone Progress</p>
                  <p className="text-sm font-black text-amber-400">{overallProgress}%</p>
                </div>
              </div>
            </div>

            {errorMap.projects && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>Projects API Note: {errorMap.projects}</span>
                <Button variant="outline" onClick={loadDashboardData} className="text-[10px] py-1">Retry</Button>
              </div>
            )}

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Milestones Tracked</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {milestones.filter((m) => Number(m.completion_pct) === 100).length} / {milestones.length}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold">
                  {milestones.length > 0 ? `${milestones.filter((m) => Number(m.completion_pct) === 100).length} Completed in DB` : 'Live API Connected'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Machinery & Fleet</span>
                  <Truck className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {resources.length > 0 ? `${resources.filter(r => r.availability_status === 'AVAILABLE' || r.status === 'Operational').length} / ${resources.length} Units` : '0 / 0 Units'}
                </p>
                <p className="text-[10px] text-amber-400 font-semibold">Live equipment telemetry</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Workforce Recorded</span>
                  <Users className="h-4 w-4 text-sky-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {workers.length > 0 ? `${workers.length} Registered` : '0 Registered'}
                </p>
                <p className="text-[10px] text-sky-400 font-semibold">
                  {attendance.length > 0 ? `${attendance.length} attendance logs today` : '0 attendance logs today'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Inventory Materials</span>
                  <Layers className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {inventory.length > 0 ? `${inventory.length} SKUs` : '0 SKUs'}
                </p>
                <p className="text-[10px] text-indigo-400 font-semibold">Warehouse stock levels</p>
              </div>
            </div>

            {}
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

              {milestones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {milestones.slice(0, 6).map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <p className="text-[11px] font-bold text-white truncate">{m.name || m.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {m.completion_pct || m.progress || 0}% • {m.status || 'In Progress'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No milestones registered yet in database.</p>
              )}
            </div>
          </div>
        )}

        {}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Project Management</h2>
                <p className="text-xs text-slate-400">Live project records fetched with JWT Authorization</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Projects
              </Button>
            </div>

            {errorMap.projects ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.projects}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <FolderKanban className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No projects found in database</p>
                <p className="text-xs text-slate-400">Projects will appear here once created via POST /api/projects</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                          Project #{proj.id} • {proj.category || 'General'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{proj.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{proj.description}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {proj.status || 'planning'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="text-[10px] block text-slate-500">Location</span>
                        <span className="text-white font-medium">{proj.location || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] block text-slate-500">Budget</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {proj.budget ? `$${Number(proj.budget).toLocaleString()}` : '$0'}
                        </span>
                      </div>
                      {proj.start_date && (
                        <div>
                          <span className="text-[10px] block text-slate-500">Start Date</span>
                          <span>{proj.start_date}</span>
                        </div>
                      )}
                      {proj.end_date && (
                        <div className="text-right">
                          <span className="text-[10px] block text-slate-500">End Date</span>
                          <span>{proj.end_date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Milestone & Progress Tracker</h2>
                <p className="text-xs text-slate-400">Changes to execution sliders write directly to the database</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Milestones
              </Button>
            </div>

            {errorMap.milestones ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.milestones}
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <SlidersHorizontal className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No milestones found</p>
                <p className="text-xs text-slate-400">Milestones will appear here once saved in the backend</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((m) => {
                  const pct = Number(m.completion_pct ?? m.progress ?? 0);
                  return (
                    <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Milestone #{m.id} {m.project_id ? `• Project ID: ${m.project_id}` : ''}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{m.name || m.title}</h4>
                          <p className="text-xs text-slate-400">
                            {m.description || (m.targetDate ? `Target: ${m.targetDate}` : '')}
                            {m.due_date ? ` • Due: ${m.due_date}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              m.status === 'Completed' || pct === 100
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : pct > 0
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {m.status || (pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Pending')}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400">{pct}%</span>
                        </div>
                      </div>

                      {}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 text-[11px]">Database Execution Slider:</span>
                          <span className="text-amber-400 font-mono text-[11px]">{pct}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) => handleProgressChange(m.id, e.target.value)}
                          className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Machinery & Resources</h2>
                <p className="text-xs text-slate-400">Equipment fleet telemetry and availability tracking</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Fleet
              </Button>
            </div>

            {errorMap.resources ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.resources}
              </div>
            ) : resources.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <Truck className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No resources registered in database</p>
                <p className="text-xs text-slate-400">Equipment will appear here when added via /api/resources</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Asset ID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">Utilization</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {resources.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-amber-400 font-bold">#{eq.id}</td>
                        <td className="p-3.5 font-bold text-white">{eq.name}</td>
                        <td className="p-3.5 text-slate-400">{eq.category}</td>
                        <td className="p-3.5 text-slate-300">{eq.quantity || 1}</td>
                        <td className="p-3.5 font-mono text-slate-400">{eq.utilization_percentage || 0}%</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eq.availability_status === 'AVAILABLE' || eq.status === 'Operational'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {eq.availability_status || eq.status || 'AVAILABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Materials & Inventory</h2>
                <p className="text-xs text-slate-400">Real-time site material warehouse inventory tracking</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Inventory
              </Button>
            </div>

            {errorMap.inventory ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.inventory}
              </div>
            ) : inventory.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <Layers className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No materials recorded in inventory</p>
                <p className="text-xs text-slate-400">Items will appear here once saved via /api/inventory</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Material Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Available Quantity</th>
                      <th className="p-3.5">Min Stock Level</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventory.map((mat) => {
                      const qty = Number(mat.quantity_available || mat.stock || 0);
                      const min = Number(mat.minimum_stock_level || mat.threshold || 0);
                      const isLow = qty <= min && min > 0;
                      return (
                        <tr key={mat.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-white">{mat.material_name || mat.item}</td>
                          <td className="p-3.5 text-slate-400">{mat.category}</td>
                          <td className="p-3.5 font-mono font-bold text-white">
                            {qty} {mat.unit || ''}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {min} {mat.unit || ''}
                          </td>
                          <td className="p-3.5 text-slate-400">{mat.location || 'On-site'}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                !isLow
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {isLow ? 'Low Stock' : 'Adequate'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'workforce' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Workforce & Attendance</h2>
                <p className="text-xs text-slate-400">Daily turnstile biometric attendance logs and registered site workers</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Workforce
              </Button>
            </div>

            {errorMap.attendance && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                Attendance API: {errorMap.attendance}
              </div>
            )}

            {}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Site Attendance Records</h3>
              {attendance.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <p className="text-xs font-semibold text-white">No attendance records today</p>
                  <p className="text-[11px] text-slate-500">Records logged via POST /api/attendance will display here</p>
                </div>
              ) : (
                attendance.map((att) => (
                  <div key={att.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Worker #{att.worker_id}</span>
                        <span className="text-[10px] font-mono text-slate-400">Project #{att.project_id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Date: {att.attendance_date} • {att.remarks || 'Standard Shift'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-500 block">Check-in / Check-out</span>
                        <span className="font-mono text-slate-300">
                          {att.check_in || '--:--'} - {att.check_out || '--:--'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        att.status === 'Present'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {att.status || 'Present'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Registered Field Crew (/api/worker)</h3>
              {workers.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No workers registered in database.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {workers.map((w) => (
                    <div key={w.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-white">{w.name}</p>
                      <p className="text-[11px] text-slate-400">{w.email}</p>
                      <p className="text-[10px] text-amber-400 font-mono">Phone: {w.phone || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {activeTab === 'procurement' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Purchase Orders & Procurement</h2>
                <p className="text-xs text-slate-400">Material requisitions, vendor purchase orders, and delivery statuses</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh Orders
              </Button>
            </div>

            {errorMap.procurements ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.procurements}
              </div>
            ) : procurements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <ShoppingCart className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No purchase orders found</p>
                <p className="text-xs text-slate-400">Orders submitted will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {procurements.map((po) => (
                  <div key={po.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          PO #{po.id} • {po.category}
                        </span>
                        {po.vendor_name && (
                          <span className="text-[10px] text-slate-400">• Vendor: {po.vendor_name}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-0.5">{po.item_name}</h4>
                      <p className="text-xs text-slate-400">
                        Qty: {po.quantity} • Estimated: ${Number(po.estimated_cost || 0).toLocaleString()}
                        {po.actual_cost && ` • Actual: $${Number(po.actual_cost).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {po.request_date && (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          Req: {po.request_date}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        po.status === 'DELIVERED' || po.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : po.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {po.status || 'REQUESTED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">System Notifications</h2>
                <p className="text-xs text-slate-400">Real-time alerts and messages for the logged-in user</p>
              </div>
              <Button variant="secondary" onClick={loadDashboardData}>
                Refresh
              </Button>
            </div>

            {errorMap.notifications ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMap.notifications}
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <Bell className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No notifications</p>
                <p className="text-xs text-slate-400">You are completely up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                      notif.is_read
                        ? 'bg-slate-900/50 border-slate-800/60 opacity-70'
                        : 'bg-slate-900 border-amber-500/30 shadow-md shadow-amber-500/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {notif.notification_type || 'System'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{notif.message}</p>
                      {notif.created_at && (
                        <p className="text-[10px] text-slate-500">{new Date(notif.created_at).toLocaleString()}</p>
                      )}
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Profile</h2>
              <p className="text-xs text-slate-400 mt-1">View your account information</p>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="h-20 w-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-3xl shrink-0">
                    {(currentUser?.name || 'U')[0].toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {currentUser?.name || 'User'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {currentUser?.email || 'user@buildtrack.io'}
                    </p>
                    <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                      {currentUser?.role || 'Project Manager'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-bold text-white mb-4">Account Information</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Full Name</span>
                      <p className="text-sm font-semibold text-white">
                        {currentUser?.name || 'Not available'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Email Address</span>
                      <p className="text-sm font-semibold text-white break-all">
                        {currentUser?.email || 'Not available'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Role</span>
                      <p className="text-sm font-semibold text-amber-400">
                        {currentUser?.role || 'Project Manager'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Account Status</span>
                      <p className="text-sm font-semibold text-emerald-400">Active</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" disabled>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
            
      </main>
    </div>
  );
};

export default Dashboard;
