import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { notificationService } from '@/api/notification.service';
import { Menu, LogOut, Sun, Moon, Bell } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, theme, setTheme } = useAppStore();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const resp = await notificationService.listNotifications({ page_size: 1 });
        setNotifCount(resp.count);
      } catch (error) {
        console.error('Failed to fetch notification count', error);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-200">
          <Menu size={24} />
        </button>
        <span className="font-medium">Welcome, {user?.username}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell size={20} className="text-gray-600" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1 rounded hover:bg-gray-200"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button onClick={logout} className="flex items-center gap-1 text-red-500 hover:underline">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};