import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '@/api/notification.service';
import { Notification } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { cooperativeService } from '@/api/cooperative.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Bell, CheckCheck, Clock, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

export const NotificationList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user?.role === 'FARMER' && user.id) {
      cooperativeService
        .listFarmers({ user: user.id, page_size: 1 })
        .then((resp) => { if (resp.results.length > 0) setFarmerId(resp.results[0].id); })
        .catch(console.error);
    }
  }, [user]);

  const fetchData = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: pageNum, ordering: '-sent_at' };
      if (user?.role === 'FARMER' && farmerId) params.farmer = farmerId;
      if (startDate) params.sent_at__gte = startDate;
      if (endDate) params.sent_at__lte = endDate;
      if (readFilter === 'unread') params.is_read = 'false';
      if (readFilter === 'read') params.is_read = 'true';
      const resp = await notificationService.listNotifications(params);
      setNotifications(resp.results);
      setCount(resp.count);
      setTotalPages(Math.ceil(resp.count / 25) || 1);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, [farmerId, user?.role, startDate, endDate, readFilter]);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: updated.is_read } : n)));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setReadFilter('all');
    setPage(1);
  };

  if (loading && !notifications.length) return <LoadingSpinner message="Loading notifications..." />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {count} total · {unreadCount > 0 ? <span className="text-amber-600 font-semibold">{unreadCount} unread</span> : 'All read'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Read status filter */}
          <div>
            <label className="form-label text-xs">Status</label>
            <div className="flex gap-1">
              {(['all', 'unread', 'read'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setReadFilter(v); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    readFilter === v
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label text-xs">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-xs py-2"
            />
          </div>
          <div>
            <label className="form-label text-xs">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-xs py-2"
            />
          </div>

          {(startDate || endDate || readFilter !== 'all') && (
            <button onClick={clearFilters} className="btn-ghost text-xs flex items-center gap-1">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="content-card divide-y divide-slate-50">
        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell size={40} className="text-slate-200 mb-3" />
            <p className="font-medium">No notifications found</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-5 transition-colors ${
                !n.is_read ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
              }`}
            >
              {/* Icon */}
              <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${
                n.is_read ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'
              }`}>
                <Bell size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{n.farmer_name}</span>
                  {!n.is_read && <span className="badge-yellow text-[10px]">Unread</span>}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(n.sent_at).toLocaleString()}
                  {n.farmer_phone && (
                    <span className="ml-2 text-slate-400">· {n.farmer_phone}</span>
                  )}
                </p>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {!n.is_read ? (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <CheckCheck size={13} /> Mark Read
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCheck size={13} className="text-emerald-500" /> Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {page} of {totalPages} · {count} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-40">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};