import { ReactNode } from 'react';
import { Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export const ActivityFeed = ({ activities, title = 'Recent Activity', maxItems = 5 }: ActivityFeedProps) => {
  const items = activities.slice(0, maxItems);

  return (
    <div className="content-card">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Clock size={32} className="mb-2 text-slate-200" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Icon or dot */}
              <div className="shrink-0 mt-0.5">
                {item.icon ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    {item.icon}
                  </div>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 ring-4 ring-emerald-50" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>

              {item.badge && (
                <div className="shrink-0">{item.badge}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};