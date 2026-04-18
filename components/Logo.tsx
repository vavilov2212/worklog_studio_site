import React from 'react';

export const Logo = ({ className = "w-10 h-10", iconOnly = false }: { className?: string, iconOnly?: boolean }) => {
  return (
    <div className={`flex items-center gap-3 ${iconOnly ? '' : 'cursor-pointer'}`}>
      <div className={className}>
        <img 
          src="/worklog_studio_site/static/app_icon_256.png" 
          alt="Worklog Studio" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
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
