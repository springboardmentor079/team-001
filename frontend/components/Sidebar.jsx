import React from 'react';
import { LayoutDashboard, FolderKanban, Truck, Users } from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, currentUserRole }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 hidden md:flex flex-col justify-between">
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Milestone 1 Modules
        </p>

        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Role Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('projects')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Projects & Milestones</span>
        </button>

        <button
          onClick={() => onSelectTab('resources')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'resources' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Machinery & Inventory</span>
        </button>

        <button
          onClick={() => onSelectTab('workforce')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'workforce' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Workforce & Attendance</span>
        </button>
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
        <p className="text-[10px] font-bold text-slate-400">Current RBAC Role:</p>
        <p className="text-xs font-bold text-amber-400 mt-0.5">
          {currentUserRole.replace('_', ' ').toUpperCase()}
        </p>
      </div>
    </aside>
  );
};