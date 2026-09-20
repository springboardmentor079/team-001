import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer';
  const variants = {
    primary: 'bg-[#facc15] hover:bg-[#fcd34d] text-[#111111] shadow-[0_14px_28px_rgba(250,204,21,0.28)]',
    secondary: 'bg-[#111111] hover:bg-[#1a1a1a] text-[#fffdf5] border border-[#111111]',
    outline: 'border border-[#facc15]/70 text-[#111111] bg-[#fffdf5] hover:bg-[#fef3c7]',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-100 border border-red-400/50 shadow-[0_0_0_1px_rgba(248,113,113,0.2)]',
  };

  return (
    <button className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};
