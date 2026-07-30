import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';
}

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', value: 'text-emerald-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', value: 'text-blue-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', value: 'text-amber-700' },
  red: { bg: 'bg-red-100', text: 'text-red-600', value: 'text-red-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', value: 'text-purple-700' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', value: 'text-cyan-700' },
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'emerald',
}: StatCardProps) => {
  const c = colorMap[color];

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-3xl font-extrabold ${c.value} leading-tight truncate`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`stat-card-icon ${c.bg} ${c.text} ml-4 shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-1.5">
          {trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
          {trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
          {trend === 'neutral' && <Minus size={14} className="text-slate-400" />}
          <span className={`text-xs font-semibold ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
          }`}>{trendValue}</span>
        </div>
      )}
    </div>
  );
};