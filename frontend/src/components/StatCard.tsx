import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeText?: string;
  badgePositive?: boolean;
  icon: LucideIcon;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgePositive = true,
  icon: Icon,
  iconBg = 'from-primary-500/20 to-primary-600/10 border-primary-500/30 text-primary-400'
}) => {
  return (
    <div className="glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Background glow circle */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-all duration-500" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <h3 className="font-display font-bold text-3xl tracking-tight text-white">
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center shadow-md ${iconBg}`}>
          <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">{subtitle}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md font-semibold border ${
            badgePositive
              ? 'bg-primary-500/15 border-primary-500/30 text-primary-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
