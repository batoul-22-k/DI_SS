
import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, isCollapsed, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
        isActive 
          ? 'bg-teal-50 text-teal-700' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className={`${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
        {icon}
      </div>
      {!isCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
      {!isCollapsed && isActive && (
        <div className="ml-auto w-1 h-4 bg-teal-600 rounded-full"></div>
      )}
    </button>
  );
};

export default SidebarItem;
