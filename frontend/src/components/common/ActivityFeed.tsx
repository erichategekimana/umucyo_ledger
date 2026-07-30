import { ReactNode } from 'react';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export const ActivityFeed = ({ activities, title = 'Recent Activity', maxItems = 5 }: ActivityFeedProps) => {
  const items = activities.slice(0, maxItems);
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start space-x-3 border-b pb-2 last:border-b-0">
            {item.icon && <span className="mt-1">{item.icon}</span>}
            <div className="flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
              <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>
      {activities.length === 0 && <p className="text-sm text-gray-500">No recent activity</p>}
    </div>
  );
};