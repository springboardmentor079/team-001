import React from 'react';
import { HardHat, LogOut } from 'lucide-react';

export const Navbar = ({ currentUser, onLogout }) => {
  return (
    <header className="h-16 border-b border-yellow-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black">
          <HardHat className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-black text-black">
            Build<span className="text-yellow-500">Track</span>
          </h1>
          <p className="text-[10px] text-gray-600">Infosys Milestone 1 — Construction PM</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-black">{currentUser?.name || 'Marcus Vance'}</p>
          <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-black font-semibold border border-yellow-300">
            {(currentUser?.role || 'PROJECT_MANAGER').toUpperCase()}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 bg-black text-xs font-semibold text-white hover:bg-yellow-400 hover:text-black cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
