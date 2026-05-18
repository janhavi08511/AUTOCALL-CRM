import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, PhoneCall, PhoneMissed, Users, TrendingUp, Clock,
  FileText, UserCheck, Upload, Zap, Activity, Award, Target
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const MOCK_DAILY = [
  { date: 'Mon', connected: 42, notConnected: 18 },
  { date: 'Tue', connected: 58, notConnected: 22 },
  { date: 'Wed', connected: 51, notConnected: 15 },
  { date: 'Thu', connected: 67, notConnected: 20 },
  { date: 'Fri', connected: 73, notConnected: 25 },
  { date: 'Sat', connected: 45, notConnected: 12 },
  { date: 'Sun', connected: 38, notConnected: 10 },
];

const MOCK_STAFF = [
  { name: 'Rahul S.', calls: 145, connected: 98, rate: 68 },
  { name: 'Priya M.', calls: 132, connected: 95, rate: 72 },
  { name: 'Amit K.', calls: 128, connected: 85, rate: 66 },
  { name: 'Sneha R.', calls: 119, connected: 89, rate: 75 },
  { name: 'Vijay P.', calls: 108, connected: 72, rate: 67 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 rounded-xl text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export function AdminDashboardView() {
  const [kpi, setKpi] = useState<any>({});
  const [loanCategories, setLoanCategories] = useState<any[]>([]);
  const [callStatus, setCallStatus] = useState<any[]>([]);
  const [staffPerf, setStaffPerf] = useState(MOCK_STAFF);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => {
      const d = r.data;
      setKpi(d);
      if (d.leadsByLoanType?.length) {
        setLoanCategories(d.leadsByLoanType.map((i: any) => ({ name: i.name, value: i.count })));
      }
      setCallStatus([
        { name: 'Connected', value: d.connectedCalls || 0, color: '#10b981' },
        { name: 'Not Connected', value: d.notConnectedCalls || 0, color: '#ef4444' },
      ]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Leads', value: (kpi.totalLeads || 0).toLocaleString(), change: '+8.2%', up: true, icon: FileText, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Calls', value: (kpi.totalCalls || 0).toLocaleString(), change: '+12.5%', up: true, icon: Phone, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Connected', value: (kpi.connectedCalls || 0).toLocaleString(), change: '+8.3%', up: true, icon: PhoneCall, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Not Connected', value: (kpi.notConnectedCalls || 0).toLocaleString(), change: '-5.2%', up: false, icon: PhoneMissed, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: "Today's Calls", value: (kpi.todayCalls || 0).toLocaleString(), change: '+15.3%', up: true, icon: Clock, gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Active Staff', value: String(kpi.activeStaff || 0), change: '+2', up: true, icon: UserCheck, gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Active Managers', value: String(kpi.activeManagers || 0), change: '+1', up: true, icon: Users, gradient: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Total Uploads', value: String(kpi.totalUploads || 0), change: '+3', up: true, icon: Upload, gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-indigo-200 mt-1">Real-time CRM overview & analytics</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{kpi.totalLeads?.toLocaleString() || '0'}</p>
              <p className="text-indigo-200 text-xs">Total Leads</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold">{kpi.connectedCalls?.toLocaleString() || '0'}</p>
              <p className="text-indigo-200 text-xs">Connected</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  <TrendingUp className={`w-3 h-3 ${!s.up ? 'rotate-180' : ''}`} />
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Calls Area Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Daily Call Trend</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This week's performance</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500" />Connected</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" />Not Connected</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_DAILY}>
              <defs>
                <linearGradient id="gConnected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNotConnected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="connected" name="Connected" stroke="#6366f1" strokeWidth={2.5} fill="url(#gConnected)" />
              <Area type="monotone" dataKey="notConnected" name="Not Connected" stroke="#ef4444" strokeWidth={2} fill="url(#gNotConnected)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Call Status Pie */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Call Status</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Overall distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={callStatus.length ? callStatus : [{ name: 'No Data', value: 1, color: '#e5e7eb' }]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {(callStatus.length ? callStatus : [{ color: '#e5e7eb' }]).map((e: any, i: number) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {callStatus.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{s.name}</span>
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Type Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Leads by Loan Type</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribution across categories</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={loanCategories.length ? loanCategories : [{ name: 'No Data', value: 0 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]}>
                {loanCategories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Leaderboard */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Staff Leaderboard</h3>
          </div>
          <div className="space-y-3">
            {staffPerf.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                  i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-2">{s.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${s.rate}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.calls}</p>
                  <p className="text-xs text-gray-400">calls</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Conversion Rate', value: kpi.totalCalls ? `${((kpi.connectedCalls / kpi.totalCalls) * 100).toFixed(1)}%` : '0%', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Leads Uploaded Today', value: (kpi.leadsUploadedToday || 0).toLocaleString(), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Avg Calls / Staff', value: kpi.activeStaff ? Math.round((kpi.todayCalls || 0) / kpi.activeStaff) : 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`glass-card p-5 flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
