import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { notificationService } from '@/api/notification.service';
import { ROUTES } from '@/config/routes';
import { Menu, LogOut, Bell, Sun, Moon, ChevronRight } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, theme, setTheme } = useAppStore();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const resp = await notificationService.listNotifications({ is_read: 'false', page_size: 1 });
        setNotifCount(resp.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    MANAGER: 'bg-emerald-100 text-emerald-700',
    COLLECTION_OFFICER: 'bg-amber-100 text-amber-700',
    VETERINARIAN: 'bg-cyan-100 text-cyan-700',
    FARMER: 'bg-green-100 text-green-700',
  };

  const roleColor = user?.role ? roleColors[user.role] || 'bg-slate-100 text-slate-600' : '';

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb style greeting */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{user?.username}</span>
          <ChevronRight size={14} className="text-slate-300" />
          {user?.role && (
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${roleColor}`}>
              {user.role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <Link
          to={ROUTES.NOTIFICATIONS}
          className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

        {/* Avatar + logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center uppercase">
            {user?.username?.slice(0, 2) || 'U'}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold
              hover:bg-red-100 transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};