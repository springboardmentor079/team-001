import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer';
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    outline: 'border border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30',
  };

  return (
    <button className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};
