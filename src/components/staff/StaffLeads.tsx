import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Flame, Thermometer, Snowflake, Circle, Search, Filter } from 'lucide-react';
import { staffAPI } from '../../services/api';
import { PendingDetailsForm } from './PendingDetailsForm';

const QUAL_CONFIG: Record<string, { icon: any; cls: string; label: string }> = {
  HOT:        { icon: Flame,       cls: 'badge-hot',  label: 'HOT' },
  WARM:       { icon: Thermometer, cls: 'badge-warm', label: 'WARM' },
  COLD:       { icon: Snowflake,   cls: 'badge-cold', label: 'COLD' },
  UNQUALIFIED:{ icon: Circle,      cls: 'badge-new',  label: 'NEW' },
};

const STAGES = ['', 'NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'NOT_INTERESTED'];

export function StaffLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (stageFilter) params.stage = stageFilter;
      const res = await staffAPI.getLeads(params);
      setLeads(res.data.leads ?? []);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [stageFilter]);

  const handleQualified = (leadId: string, qualification: string) => {
    setLeads(p => p.map(l => l.id === leadId ? { ...l, qualification } : l));
    setSelected(null);
  };

  const filtered = leads.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {selected && (
          <PendingDetailsForm
            leadId={selected.id}
            leadName={selected.name}
            onClose={() => setSelected(null)}
            onSaved={(q) => handleQualified(selected.id, q)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Leads</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{leads.length} leads assigned to you</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by name or city..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
      </div>

      {/* Stage Filters */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              stageFilter === s
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="relative w-10 h-10"><div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" /><div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
              No leads found.
            </div>
          ) : filtered.map((lead: any, i) => {
            const qc = QUAL_CONFIG[lead.qualification] ?? QUAL_CONFIG.UNQUALIFIED;
            const QIcon = qc.icon;
            const canFill = ['INTERESTED', 'FOLLOW_UP', 'CONTACTED'].includes(lead.stage);
            return (
              <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{lead.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{lead.phone}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${qc.cls}`}>
                    <QIcon className="w-3 h-3" />{qc.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {lead.city && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{lead.city}</span>}
                  {lead.loanCategory?.name && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs">{lead.loanCategory.name}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    lead.stage === 'INTERESTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    lead.stage === 'FOLLOW_UP' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    lead.stage === 'NOT_INTERESTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{lead.stage}</span>
                </div>

                {canFill && (
                  <button onClick={() => setSelected(lead)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    Fill Pending Details
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
