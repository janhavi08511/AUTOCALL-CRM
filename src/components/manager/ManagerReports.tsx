import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, FileSpreadsheet, RefreshCw, TrendingUp, Phone, PhoneCall, PhoneMissed } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ManagerReports() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', staffId: '', callResult: '' });
  const [reports, setReports] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    window.fetch('http://localhost:5000/api/manager/staff', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStaff).catch(() => {});
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);
      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.callResult) params.append('callResult', filters.callResult);
      const res = await window.fetch(`http://localhost:5000/api/manager/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setReports(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['Lead Name', 'Phone', 'Loan Type', 'Staff', 'Result', 'Duration', 'Date'];
    const rows = reports.map(r => [r.leadName, r.leadPhone, r.loanType, r.staffName, r.callResult, r.duration || 0, new Date(r.date).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const summary = {
    total: reports.length,
    connected: reports.filter(r => r.callResult === 'CONNECTED').length,
    notConnected: reports.filter(r => r.callResult === 'NOT_CONNECTED').length,
    rate: reports.length ? ((reports.filter(r => r.callResult === 'CONNECTED').length / reports.length) * 100).toFixed(1) : '0',
  };

  // Group by staff for chart
  const staffChart = Object.values(reports.reduce((acc: any, r) => {
    if (!acc[r.staffName]) acc[r.staffName] = { name: r.staffName, total: 0, connected: 0 };
    acc[r.staffName].total++;
    if (r.callResult === 'CONNECTED') acc[r.staffName].connected++;
    return acc;
  }, {}));

  const RESULT_COLOR: Record<string, string> = {
    CONNECTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    NOT_CONNECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    BUSY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    NO_ANSWER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    WRONG_NUMBER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    NOT_INTERESTED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analyze call performance and export data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: summary.total, icon: Phone, color: 'from-blue-500 to-indigo-600' },
          { label: 'Connected', value: summary.connected, icon: PhoneCall, color: 'from-emerald-500 to-teal-600' },
          { label: 'Not Connected', value: summary.notConnected, icon: PhoneMissed, color: 'from-red-500 to-rose-600' },
          { label: 'Success Rate', value: `${summary.rate}%`, icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-indigo-500" /> Filters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">From Date</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">To Date</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Staff</label>
            <select value={filters.staffId} onChange={e => setFilters({ ...filters, staffId: e.target.value })} className="input-field text-sm">
              <option value="">All Staff</option>
              {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Call Result</label>
            <select value={filters.callResult} onChange={e => setFilters({ ...filters, callResult: e.target.value })} className="input-field text-sm">
              <option value="">All Results</option>
              {['CONNECTED', 'NOT_CONNECTED', 'BUSY', 'NO_ANSWER', 'WRONG_NUMBER'].map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={fetchReports} disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Filter className="w-4 h-4" />}
            Apply Filters
          </button>
          <button onClick={() => { setFilters({ dateFrom: '', dateTo: '', staffId: '', callResult: '' }); fetchReports(); }}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Staff Performance Chart */}
      {staffChart.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Staff Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={staffChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="connected" name="Connected" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50">
              <tr>
                {['Lead', 'Loan Type', 'Staff', 'Result', 'Duration', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {reports.slice(0, 100).map((r, i) => (
                <tr key={r.id || i} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.leadName}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.leadPhone?.replace(/(\d{5})\d{5}/, '$1XXXXX')}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{r.loanType}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{r.staffName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RESULT_COLOR[r.callResult] || RESULT_COLOR.NOT_INTERESTED}`}>
                      {r.callResult?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {r.duration ? `${Math.floor(r.duration / 60)}:${String(r.duration % 60).padStart(2, '0')}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">No reports found. Apply filters and search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
