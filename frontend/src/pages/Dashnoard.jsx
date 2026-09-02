import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Activity, 
  SlidersHorizontal 
} from 'lucide-react';
import { Button } from '../components/Button';

export const Dashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milestones' | 'resources' | 'workforce'
  const [notification, setNotification] = useState('');

  const [milestones, setMilestones] = useState([
    { id: 'm1', title: 'Site Preparation & Excavation', phase: 'Phase 1 - Groundwork', progress: 100, targetDate: '2026-03-15', status: 'Completed', lead: 'Dave K. (Site Eng)', budgetUtilized: '$420,000 / $420,000' },
    { id: 'm2', title: 'Foundation & Deep Sub-Structure Piling', phase: 'Phase 1 - Groundwork', progress: 100, targetDate: '2026-05-10', status: 'Completed', lead: 'Marcus V. (PM)', budgetUtilized: '$1,850,000 / $1,900,000' },
    { id: 'm3', title: 'Structural Steel & Reinforced Concrete (RCC) Frame', phase: 'Phase 2 - Core Superstructure', progress: 75, targetDate: '2026-10-30', status: 'In Progress', lead: 'Dave K. (Site Eng)', budgetUtilized: '$3,100,000 / $4,200,000' },
    { id: 'm4', title: 'MEP (Mechanical, Electrical & Plumbing) Rough-in', phase: 'Phase 3 - Utilities & Enclosure', progress: 40, targetDate: '2027-01-20', status: 'In Progress', lead: 'Elena R. (Contractor)', budgetUtilized: '$850,000 / $2,100,000' },
    { id: 'm5', title: 'Exterior Curtain Wall Glazing & Facade', phase: 'Phase 3 - Utilities & Enclosure', progress: 15, targetDate: '2027-04-15', status: 'Pending', lead: 'Elena R. (Contractor)', budgetUtilized: '$200,000 / $1,600,000' },
    { id: 'm6', title: 'Interior Drywall & Architectural Finishing', phase: 'Phase 4 - Interior Fit-out', progress: 0, targetDate: '2027-07-30', status: 'Pending', lead: 'Elena R. (Contractor)', budgetUtilized: '$0 / $1,400,000' },
    { id: 'm7', title: 'Final Commissioning, Fire Safety & Handover Audit', phase: 'Phase 5 - Closeout & Handover', progress: 0, targetDate: '2027-09-15', status: 'Pending', lead: 'Sarah J. (Lead Auditor)', budgetUtilized: '$0 / $350,000' },
  ]);

  const machinery = [
    { id: 'EQ-101', name: 'Liebherr 280 EC-H Tower Crane', type: 'Heavy Lifting', status: 'Operational', operator: 'Sam Wilson', hoursLogged: '1,420 hrs' },
    { id: 'EQ-102', name: 'CAT 320 Hydraulic Excavator', type: 'Earthmoving', status: 'Operational', operator: 'Raj Patel', hoursLogged: '860 hrs' },
    { id: 'EQ-103', name: 'Schwing Stetter Concrete Boom Pump', type: 'Pumping', status: 'Maintenance', operator: 'Carlos Mendez', hoursLogged: '640 hrs' },
    { id: 'EQ-104', name: 'Volvo A40G Articulated Hauler', type: 'Hauling', status: 'Operational', operator: 'Liam Chen', hoursLogged: '910 hrs' },
    { id: 'EQ-105', name: 'GenSet 500kVA Standby Power', type: 'Power Utility', status: 'Operational', operator: 'Autonomous', hoursLogged: '2,150 hrs' },
  ];

  const materials = [
    { item: 'TMT Steel Rebar (Fe 500D)', category: 'Structural', stock: '185 MT', threshold: '50 MT', status: 'Adequate' },
    { item: 'OPC 53 Grade Cement', category: 'Civil', stock: '2,400 Bags', threshold: '500 Bags', status: 'Adequate' },
    { item: 'M25 Ready Mix Concrete (RMC)', category: 'Civil', stock: '140 m³', threshold: '80 m³', status: 'Low Stock' },
    { item: 'AAC Masonry Blocks (600x200x150)', category: 'Masonry', stock: '8,200 Pcs', threshold: '2,000 Pcs', status: 'Adequate' },
    { item: 'Conduit PVC Pipes 25mm', category: 'MEP Electrical', stock: '1,200 Mtr', threshold: '300 Mtr', status: 'Adequate' },
  ];

  const attendance = [
    { trade: 'Rebar & Steel Fixing Crew', headCount: 42, onSite: 40, shift: 'Morning (07:00 - 15:30)', supervisor: 'Master Mason J. Vance' },
    { trade: 'Concrete Formwork & Shuttering', headCount: 35, onSite: 34, shift: 'Morning (07:00 - 15:30)', supervisor: 'Chief Carpenter M. Ross' },
    { trade: 'MEP Utility Specialists', headCount: 18, onSite: 18, shift: 'Morning (08:00 - 16:30)', supervisor: 'Eng. K. Nair' },
    { trade: 'Tower Crane & Heavy Rigging Operators', headCount: 8, onSite: 8, shift: 'Continuous Rotational', supervisor: 'Safety Chief T. Gomez' },
    { trade: 'Site Survey & Quality Assurance', headCount: 6, onSite: 6, shift: 'General (08:30 - 17:00)', supervisor: 'Dave K. (Site Eng)' },
  ];

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
    setNotification('Milestone progress recalculated.');
    setTimeout(() => setNotification(''), 3000);
  };

  const overallProgress = Math.round(
    milestones.reduce((acc, curr) => acc + curr.progress, 0) / milestones.length
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar navigation */}
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
          <p className="text-xs font-black text-amber-400 truncate">{currentUser?.name || 'Marcus Vance'}</p>
          <p className="text-[10px] text-slate-500 font-mono">{(currentUser?.role || 'PROJECT_MANAGER').toUpperCase()}</p>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Milestones Completed</span>
                <p className="text-2xl font-black text-white">
                  {milestones.filter((m) => m.progress === 100).length} / {milestones.length}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold">2 Critical phases completed</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Active Machinery</span>
                <p className="text-2xl font-black text-white">4 / 5 Units</p>
                <p className="text-[10px] text-amber-400 font-semibold">1 unit in maintenance</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Labor Headcount</span>
                <p className="text-2xl font-black text-white">106 Active</p>
                <p className="text-[10px] text-sky-400 font-semibold">97.2% biometric turnout</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Safety Days</span>
                <p className="text-2xl font-black text-white">142 Days</p>
                <p className="text-[10px] text-indigo-400 font-semibold">Zero lost-time injuries</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">Interactive Milestone & Phase Tracker</h2>
            {milestones.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{m.phase}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{m.title}</h4>
                    <p className="text-xs text-slate-400">{m.targetDate} • Lead: {m.lead}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 font-mono">{m.progress}%</span>
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
            ))}
          </div>
        )}

        {/* Tab 3: Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Heavy Machinery & Fleet Status</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
              {machinery.map((eq) => (
                <div key={eq.id} className="flex justify-between py-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white">{eq.name}</span>
                  <span className="text-amber-400">{eq.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Workforce */}
        {activeTab === 'workforce' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Biometric Turnstile Workforce</h3>
            <div className="space-y-3">
              {attendance.map((att, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{att.trade}</h4>
                    <p className="text-xs text-slate-400">{att.supervisor}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{att.onSite} / {att.headCount} Present</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
