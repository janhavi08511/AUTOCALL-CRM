import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Calendar, Filter, TrendingUp, Phone, PhoneCall, Users, RefreshCw } from 'lucide-react';

export function ReportsExport() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', staffId: '', managerId: '', callResult: '' });
  const [reports, setReports] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      window.fetch('http://localhost:5000/api/admin/users?role=STAFF', { headers: h }).then(r => r.json()),
      window.fetch('http://localhost:5000/api/admin/users?role=MANAGER', { headers: h }).then(r => r.json()),
    ]).then(([s, m]) => {
      setStaff(Array.isArray(s) ? s : s.users || []);
      setManagers(Array.isArray(m) ? m : m.users || []);
    }).catch(() => {});
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
      const res = await window.fetch(`http://localhost:5000/api/admin/call-logs?${params}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.callLogs || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['Lead Name', 'Phone', 'Loan Type', 'Staff', 'Result', 'Duration (s)', 'Attempt', 'Date'];
    const rows = reports.map(r => [
      r.lead?.name, r.lead?.phone, r.lead?.loanCategory?.name,
      r.staff?.name, r.callResult, r.callDuration || 0, r.attemptNumber,
      new Date(r.createdAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `crm-report-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const summary = {
    total: reports.length,
    connected: reports.filter(r => r.callResult === 'CONNECTED').length,
    notConnected: reports.filter(r => r.callResult !== 'CONNECTED').length,
    rate: reports.length ? ((reports.filter(r => r.callResult === 'CONNECTED').length / reports.length) * 100).toFixed(1) : '0',
  };

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Export</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Generate and download CRM reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: summary.total, icon: Phone, gradient: 'from-blue-500 to-indigo-600' },
          { label: 'Connected', value: summary.connected, icon: PhoneCall, gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Not Connected', value: summary.notConnected, icon: Phone, gradient: 'from-red-500 to-rose-600' },
          { label: 'Success Rate', value: `${summary.rate}%`, icon: TrendingUp, gradient: 'from-purple-500 to-violet-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Manager</label>
            <select value={filters.managerId} onChange={e => setFilters({ ...filters, managerId: e.target.value })} className="input-field text-sm">
              <option value="">All Managers</option>
              {managers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
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
          <button onClick={fetchReports} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Filter className="w-4 h-4" />}
            Apply Filters
          </button>
          <button onClick={() => { setFilters({ dateFrom: '', dateTo: '', staffId: '', managerId: '', callResult: '' }); fetchReports(); }}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50">
              <tr>
                {['Customer', 'Staff', 'Loan Type', 'Result', 'Duration', 'Attempt', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {reports.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.lead?.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.lead?.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{r.staff?.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{r.lead?.loanCategory?.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RESULT_COLOR[r.callResult] || RESULT_COLOR.NOT_INTERESTED}`}>
                      {r.callResult?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {r.callDuration ? `${Math.floor(r.callDuration / 60)}:${String(r.callDuration % 60).padStart(2, '0')}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">#{r.attemptNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">No call logs found. Apply filters to search.</div>
          )}
          {loading && <div className="text-center py-8"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>}
        </div>
      </div>
    </div>
  );
}
