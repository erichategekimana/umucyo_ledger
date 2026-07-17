import React from 'react';
import { ShieldCheck, Globe, Bell, User as UserIcon } from 'lucide-react';
import type { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  language: 'en' | 'rw';
  onLanguageChange: (lang: 'en' | 'rw') => void;
  coopName: string;
}

export const Header: React.FC<HeaderProps> = ({ role, language, onLanguageChange, coopName }) => {
  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'MANAGER': return 'bg-primary-500/20 text-primary-300 border-primary-500/30';
      case 'COLLECTION_OFFICER': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'VETERINARIAN': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
          <h1 className="font-display font-semibold text-lg text-slate-100 tracking-tight">
            {coopName}
          </h1>
        </div>
        <span className="text-slate-600">|</span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1.5 ${getRoleBadgeColor(role)}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{role.replace('_', ' ')}</span>
        </span>
      </div>

      <div className="flex items-center space-x-5">
        <button 
          onClick={() => onLanguageChange(language === 'en' ? 'rw' : 'en')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-primary-400" />
          <span>{language === 'en' ? 'EN (English)' : 'RW (Kinyarwanda)'}</span>
        </button>

        <div className="relative">
          <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
          </button>
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-primary-500/20">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-200 leading-tight">Eric Hategekimana</span>
            <span className="text-xs text-slate-400 font-mono">ID: RCA/0892</span>
          </div>
        </div>
      </div>
    </header>
  );
};
