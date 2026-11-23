import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#12141d] border border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-700 hover:bg-[#151722]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
