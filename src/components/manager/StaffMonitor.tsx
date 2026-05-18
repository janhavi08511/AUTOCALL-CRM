import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Coffee, WifiOff, RefreshCw, Clock, Phone, TrendingUp } from 'lucide-react';

export function StaffMonitor() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await window.fetch('http://localhost:5000/api/manager/staff/monitoring', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { setStaffList(await res.json()); setLastUpdated(new Date()); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 30000); return () => clearInterval(t); }, []);

  const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
    ACTIVE:   { label: 'Active',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', icon: Activity },
    ON_BREAK: { label: 'On Break', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   dot: 'bg-amber-500',   icon: Coffee },
    OFFLINE:  { label: 'Offline',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',           dot: 'bg-gray-400',    icon: WifiOff },
  };

  const counts = {
    active: staffList.filter(s => s.status === 'ACTIVE').length,
    onBreak: staffList.filter(s => s.status === 'ON_BREAK').length,
    offline: staffList.filter(s => s.status === 'OFFLINE').length,
  };

  const fmtMins = (m: number) => {
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900" /><div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Staff Monitor</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        </div>
        <button onClick={fetch} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: counts.active, icon: Activity, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'On Break', count: counts.onBreak, icon: Coffee, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Offline', count: counts.offline, icon: WifiOff, gradient: 'from-gray-400 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-700/50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staffList.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.OFFLINE;
          const SIcon = cfg.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${cfg.dot}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                      <SIcon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.callsToday}</p>
                  <p className="text-xs text-gray-400">calls today</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Work Time</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtMins(s.workTime || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Coffee className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Break Time</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtMins(s.breakTime || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Productivity bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Productivity</span>
                  <span>{s.workTime ? Math.min(Math.round((s.callsToday / Math.max(s.workTime / 60, 1)) * 10), 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${s.workTime ? Math.min(Math.round((s.callsToday / Math.max(s.workTime / 60, 1)) * 10), 100) : 0}%` }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {staffList.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No staff members found under your team.</p>
        </div>
      )}
    </div>
  );
}
