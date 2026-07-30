import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/api/user.service';
import { User, Role } from '@/types';
import { Shield, Search, AlertCircle, Save } from 'lucide-react';

export const RoleManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data.results || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('');
    setSuccessMsg('');
    setSavingId(userId);
    try {
      await userService.changeRole(userId, newRole);
      setSuccessMsg('Role updated successfully.');
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as Role } : u));
    } catch (err: any) {
      const { handleApiError } = await import('@/utils/errorHandler');
      setError(handleApiError(err, 'Failed to update role.'));
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.phone_number.includes(search)
  );

  const getAvailableRoles = () => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      return [
        { value: 'FARMER', label: 'Farmer' },
        { value: 'COLLECTION_OFFICER', label: 'Collection Officer' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'ADMIN', label: 'Cooperative Admin' },
        { value: 'VETERINARIAN', label: 'Veterinarian' },
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
      ];
    }
    
    // Coop admin can only set these roles
    return [
      { value: 'FARMER', label: 'Farmer' },
      { value: 'COLLECTION_OFFICER', label: 'Collection Officer' },
      { value: 'MANAGER', label: 'Manager' },
    ];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-emerald-500" /> Role Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage access control and permissions for users in your scope.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
      
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-success flex items-center gap-2 text-sm bg-emerald-50 text-emerald-600 p-3 rounded-lg border border-emerald-100 mb-4">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Role</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{u.username}</div>
                      </td>
                      <td className="p-4 text-slate-600">{u.phone_number}</td>
                      <td className="p-4 text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {u.role_display || u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={savingId === u.id || u.id === currentUser?.id}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                          >
                            <option value={u.role} disabled>{u.role_display || u.role}</option>
                            {availableRoles.filter(r => r.value !== u.role).map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                          {savingId === u.id && <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick mock for CheckCircle missing in imports
const CheckCircle = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
