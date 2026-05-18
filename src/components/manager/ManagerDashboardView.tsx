import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Phone, PhoneCall, Users, TrendingUp, Clock, AlertCircle, RefreshCw, Zap } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 rounded-xl text-sm shadow-xl">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export function ManagerDashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [sRes, cRes] = await Promise.all([
        fetch('http://localhost:5000/api/manager/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/manager/dashboard/charts', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (cRes.ok) setCharts(await cRes.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const kpiCards = [
    { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600', change: '+12%' },
    { label: "Today's Calls", value: stats?.callsToday ?? 0, icon: Phone, gradient: 'from-purple-500 to-violet-600', change: '+8%' },
    { label: 'Connected', value: stats?.connectedCalls ?? 0, icon: PhoneCall, gradient: 'from-emerald-500 to-teal-600', change: '+5%' },
    { label: 'Not Connected', value: stats?.notConnectedCalls ?? 0, icon: Phone, gradient: 'from-red-500 to-rose-600', change: '-3%' },
    { label: 'Follow-ups', value: stats?.followUpsPending ?? 0, icon: Clock, gradient: 'from-amber-500 to-orange-600', change: '+2' },
    { label: 'Retry Scheduled', value: stats?.retryScheduled ?? 0, icon: AlertCircle, gradient: 'from-orange-500 to-red-500', change: '+1' },
    { label: 'Active Staff', value: stats?.activeStaff ?? 0, icon: Users, gradient: 'from-teal-500 to-cyan-600', change: '+0' },
    { label: 'Conversion Rate', value: stats?.totalLeads ? `${((stats.connectedCalls / Math.max(stats.callsToday, 1)) * 100).toFixed(1)}%` : '0%', icon: Zap, gradient: 'from-indigo-500 to-purple-600', change: '+2.1%' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-6 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
            <p className="text-blue-200 mt-1">Team operations & lead management</p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          const isUp = !k.change.startsWith('-');
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls by Result */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Calls by Result</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Call outcome distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={charts?.callsByResult?.length ? charts.callsByResult : [{ result: 'No Data', count: 1 }]}
                dataKey="count" nameKey="result" cx="50%" cy="50%"
                innerRadius={55} outerRadius={90} paddingAngle={3} label={({ result, percent }) => `${result}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {(charts?.callsByResult || [{ result: '' }]).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Loan Type */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Leads by Loan Type</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribution across loan categories</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts?.leadsByLoanType || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="loanType" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                {(charts?.leadsByLoanType || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Staff Performance</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Calls made by each staff member</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={charts?.staffPerformance || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="calls" name="Calls" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
