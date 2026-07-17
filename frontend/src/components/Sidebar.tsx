import React from 'react';
import { 
  LayoutDashboard, 
  Scale, 
  DollarSign, 
  MapPin, 
  FileSpreadsheet, 
  Sprout, 
  Terminal,
  ChevronRight
} from 'lucide-react';

export type NavTab = 'dashboard' | 'harvest' | 'sales' | 'agronomy' | 'audit' | 'ussd';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard },
    { id: 'harvest', label: 'Harvest Ledger (Append-Only)', icon: Scale },
    { id: 'sales', label: 'Bulk Sales & Revenue Split', icon: DollarSign },
    { id: 'agronomy', label: 'Agronomy GIS Monitoring', icon: MapPin },
    { id: 'audit', label: 'RCA Audit Report Export', icon: FileSpreadsheet },
    { id: 'ussd', label: 'USSD Gateway Logs (*789#)', icon: Terminal },
  ] as const;

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-6">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center space-x-3.5 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-primary-500/30">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-1">
              Umucyo <span className="text-primary-400 font-light">Ledger</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
              PostgreSQL 16 Engine
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-primary-300 border border-primary-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-primary-400 animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Integrity Footer Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Fraud Block Status</span>
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Append-only integrity & bottom-up SUM() locks active across 19 unit tests.
        </p>
        <div className="pt-1 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-500">
          <span>SRS v1.0</span>
          <span>PG 16.x</span>
        </div>
      </div>
    </aside>
  );
};
