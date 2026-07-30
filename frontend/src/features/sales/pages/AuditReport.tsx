import { useState, useEffect } from 'react';
import { salesService } from '@/api/sales.service';
import { cooperativeService } from '@/api/cooperative.service';
import { useAuth } from '@/hooks/useAuth';
import { AuditReport as AuditReportType } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';


// create a simple page that fetches the report for a selected cooperative and displays it.


export const AuditReport = () => {
  const { user } = useAuth();
  const [cooperativeId, setCooperativeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<AuditReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      cooperativeService.listCooperatives({ page_size: 100 })
        .then(resp => setCooperatives(resp.results.map(c => ({ id: c.id, name: c.name }))))
        .catch(console.error);
    }
  }, [user]);

  const fetchReport = async () => {
    if (!cooperativeId) return;
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await salesService.getAuditReport(cooperativeId, params);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch audit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audit Report</h1>
      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Cooperative</label>
              <select
                value={cooperativeId}
                onChange={(e) => setCooperativeId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Select cooperative</option>
                {cooperatives.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
          <button
            onClick={fetchReport}
            disabled={!cooperativeId || loading}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate Report
          </button>
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}

      {report && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">{report.cooperative_name}</h2>
          <p>Period: {report.start_date} to {report.end_date}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
            <div className="border p-2 rounded">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-lg font-bold">{report.summary.total_sales}</p>
            </div>
            <div className="border p-2 rounded">
              <p className="text-sm text-gray-500">Total Revenue (RWF)</p>
              <p className="text-lg font-bold">{Number(report.summary.total_revenue || 0).toFixed(2)}</p>
            </div>
            <div className="border p-2 rounded">
              <p className="text-sm text-gray-500">Total Payouts (RWF)</p>
              <p className="text-lg font-bold">{Number(report.summary.total_payouts || 0).toFixed(2)}</p>
            </div>
            <div className="border p-2 rounded">
              <p className="text-sm text-gray-500">Pending Payouts (RWF)</p>
              <p className="text-lg font-bold">{Number(report.summary.pending_payouts || 0).toFixed(2)}</p>
            </div>
          </div>
          {/* Optionally list sales and payouts */}
          <div className="mt-4">
            <h3 className="font-medium">Sales</h3>
            <ul className="divide-y">
              {report.sales.map(s => (
                <li key={s.id} className="py-2">Sale to {s.buyer}: {s.total_weight_kg}kg @ {s.price_per_kg} RWF/kg = {s.total_amount} RWF</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <h3 className="font-medium">Payouts</h3>
            <ul className="divide-y">
              {report.payouts.map(p => (
                <li key={p.id} className="py-2">{p.farmer_name}: {p.amount} RWF {p.paid ? '(Paid)' : '(Pending)'}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};