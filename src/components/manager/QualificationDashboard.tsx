import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Thermometer, Snowflake, Circle, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { managerAPI } from '../../services/api';

const QUAL_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; gradient: string }> = {
  HOT:  { label: 'Hot Leads',  icon: Flame,       color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',    gradient: 'from-red-500 to-rose-600' },
  WARM: { label: 'Warm Leads', icon: Thermometer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', gradient: 'from-amber-500 to-orange-600' },
  COLD: { label: 'Cold Leads', icon: Snowflake,   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   gradient: 'from-blue-500 to-cyan-600' },
  UNQUALIFIED: { label: 'Unqualified', icon: Circle, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/50', gradient: 'from-gray-400 to-gray-600' },
};

const QUAL_BADGE: Record<string, string> = {
  HOT: 'badge-hot', WARM: 'badge-warm', COLD: 'badge-cold', UNQUALIFIED: 'badge-new',
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#9ca3af'];

export function QualificationDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ qualification: '', city: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await managerAPI.getQualificationDashboard(filters);
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" /><div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" /></div>
    </div>
  );

  const stats = data?.stats || { hot: 0, warm: 0, cold: 0, unqualified: 0 };
  const leads = data?.leads || [];
  const pieData = [
    { name: 'Hot', value: stats.hot },
    { name: 'Warm', value: stats.warm },
    { name: 'Cold', value: stats.cold },
    { name: 'Unqualified', value: stats.unqualified },
  ].filter(d => d.value > 0);

  const filteredLeads = leads.filter((l: any) =>
    (!filters.qualification || l.qualification === filters.qualification) &&
    (!filters.city || l.city?.toLowerCase().includes(filters.city.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Qualification</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-powered lead scoring and classification</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Qualification Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(QUAL_CONFIG).map(([key, cfg], i) => {
          const Icon = cfg.icon;
          const count = stats[key.toLowerCase()] || 0;
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => setFilters(f => ({ ...f, qualification: f.qualification === key ? '' : key }))}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cfg.label}</p>
              {filters.qualification === key && (
                <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Qualification Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData.length ? pieData : [{ name: 'No Data', value: 1 }]}
                cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">7-Day Conversion Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.charts?.conversionTrend || []}>
              <defs>
                <linearGradient id="gHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gWarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="HOT" name="Hot" stroke="#ef4444" strokeWidth={2} fill="url(#gHot)" />
              <Area type="monotone" dataKey="WARM" name="Warm" stroke="#f59e0b" strokeWidth={2} fill="url(#gWarm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Filter by city..." value={filters.city}
          onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
          className="input-field text-sm flex-1 min-w-40" />
        <select value={filters.qualification} onChange={e => setFilters(f => ({ ...f, qualification: e.target.value }))}
          className="input-field text-sm w-40">
          <option value="">All Qualifications</option>
          {Object.keys(QUAL_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={() => setFilters({ qualification: '', city: '' })} className="btn-secondary text-sm px-4">
          Clear
        </button>
      </div>

      {/* Leads Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50">
              <tr>
                {['Lead', 'City', 'Loan Type', 'Stage', 'Qualification', 'Staff', 'Income', 'CIBIL'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredLeads.slice(0, 50).map((l: any) => {
                const qc = QUAL_CONFIG[l.qualification] ?? QUAL_CONFIG.UNQUALIFIED;
                const QIcon = qc.icon;
                return (
                  <tr key={l.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{l.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{l.city}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{l.loanType}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">{l.stage}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${QUAL_BADGE[l.qualification] || QUAL_BADGE.UNQUALIFIED}`}>
                        <QIcon className="w-3 h-3" />{l.qualification}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{l.staffName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {l.pendingDetail?.monthlyIncome ? `₹${l.pendingDetail.monthlyIncome.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {l.pendingDetail?.cibilScore || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">No qualified leads found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
