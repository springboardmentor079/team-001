import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-[#1B4332] hover:bg-[#2D664D] text-white shadow-[0_8px_20px_rgba(27,67,50,0.16)]',
    secondary: 'bg-white hover:bg-[#F7F5F0] text-[#1B4332] border border-[#E3DFD5]',
    outline: 'border border-[#52B788]/60 text-[#1B4332] bg-white hover:bg-[#E2F3EB]',
    danger: 'bg-[#F8EBE7] hover:bg-[#f2d9d1] text-[#9B4D37] border border-[#D97757]/30',
  };

  return (
    <button className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};
