import React from 'react';
import { HardHat, LogOut } from 'lucide-react';

export const Navbar = ({ currentUser, onLogout }) => {
  return (
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
          <p className="text-xs font-bold text-white">{currentUser?.name || 'Marcus Vance'}</p>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            {(currentUser?.role || 'PROJECT_MANAGER').toUpperCase()}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
