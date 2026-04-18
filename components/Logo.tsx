import React from 'react';

export const Logo = ({ className = "w-10 h-10", iconOnly = false }: { className?: string, iconOnly?: boolean }) => {
  return (
    <div className={`flex items-center gap-3 ${iconOnly ? '' : 'cursor-pointer'}`}>
      <div className={className}>
        <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect width="128" height="128" rx="28" fill="#FFFFFF" stroke="#E5E5E5" strokeWidth="1"/>
          <circle cx="64" cy="64" r="32" stroke="#007AFF" strokeWidth="8" strokeDasharray="150 50" strokeLinecap="round"/>
          <rect x="54" y="54" width="20" height="20" rx="4" fill="#007AFF"/>
        </svg>
      </div>
      {!iconOnly && (
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-ink leading-tight tracking-tight">Worklog Studio</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-accent font-bold">Flow Performance</p>
        </div>
      )}
    </div>
  );
};
