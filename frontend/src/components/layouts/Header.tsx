import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, theme, setTheme } = useAppStore();

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-200">
          <Menu size={24} />
        </button>
        <span className="font-medium">Welcome, {user?.username}</span>
      </div>
      <div className="flex items-center gap-4">
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