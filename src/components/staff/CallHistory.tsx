import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, CheckCircle2, XCircle, Clock, PhoneCall, TrendingUp } from 'lucide-react';
import { staffAPI } from '../../services/api';

const RESULT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CONNECTED:     { label: 'Connected',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  NOT_CONNECTED: { label: 'Not Connected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: XCircle },
  BUSY:          { label: 'Busy',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',          icon: Phone },
  NO_ANSWER:     { label: 'No Answer',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',      icon: Phone },
  WRONG_NUMBER:  { label: 'Wrong Number',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',      icon: Phone },
  NOT_INTERESTED:{ label: 'Not Interested',color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',                 icon: XCircle },
};

export function CallHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    staffAPI.getCallHistory({ page, limit: 20 }).then(r => {
      setLogs(r.data.callLogs ?? []);
      setTotal(r.data.pagination?.total ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const connected = logs.filter(l => l.callResult === 'CONNECTED').length;
  const followUp = logs.filter(l => l.lead?.stage === 'FOLLOW_UP').length;
  const rate = logs.length ? ((connected / logs.length) * 100).toFixed(0) : '0';

  const fmtDur = (s?: number) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—';

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-10 h-10"><div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" /><div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" /></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Call History</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{total} total calls recorded</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: logs.length, icon: Phone, color: 'from-blue-500 to-indigo-600' },
          { label: 'Connected', value: connected, icon: PhoneCall, color: 'from-emerald-500 to-teal-600' },
          { label: 'Follow-up', value: followUp, icon: Clock, color: 'from-amber-500 to-orange-600' },
          { label: 'Rate', value: `${rate}%`, icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Call List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Calls</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">No call history yet.</div>
          ) : logs.map((log, i) => {
            const rc = RESULT_CONFIG[log.callResult] ?? RESULT_CONFIG.NOT_CONNECTED;
            const RIcon = rc.icon;
            return (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{log.lead?.name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rc.color}`}>
                        <RIcon className="w-3 h-3" />{rc.label}
                      </span>
                      {log.attemptNumber > 1 && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                          Attempt #{log.attemptNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{log.lead?.phone}</p>
                    {log.lead?.loanCategory?.name && (
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{log.lead.loanCategory.name}</p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">{log.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {log.callDuration && (
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDur(log.callDuration)}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Performance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        </div>
        <h3 className="font-semibold mb-3 relative">Performance Summary</h3>
        <div className="grid grid-cols-2 gap-4 relative">
          <div>
            <p className="text-xs text-indigo-200">Success Rate</p>
            <p className="text-2xl font-bold">{rate}%</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">Total Calls</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
