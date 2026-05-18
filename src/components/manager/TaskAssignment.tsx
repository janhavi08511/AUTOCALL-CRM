import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Users, Zap, Search, Filter, CheckSquare, Square, ArrowRight, RefreshCw } from 'lucide-react';

export function TaskAssignment() {
  const [loanCategories, setLoanCategories] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [filters, setFilters] = useState({ city: '', loanCategoryId: '' });
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      window.fetch('http://localhost:5000/api/manager/loan-categories', { headers: h }).then(r => r.json()),
      window.fetch('http://localhost:5000/api/manager/staff', { headers: h }).then(r => r.json()),
    ]).then(([cats, st]) => { setLoanCategories(cats); setStaff(st); }).catch(() => {});
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.loanCategoryId) params.append('loanCategoryId', filters.loanCategoryId);
      const res = await window.fetch(`http://localhost:5000/api/manager/leads/unassigned?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedStaff.length || !leads.length) return;
    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await window.fetch('http://localhost:5000/api/manager/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filters, staffIds: selectedStaff }),
      });
      const data = await res.json();
      setSuccess(`✅ Assigned ${data.assignedCount} leads to ${data.totalStaff} staff members`);
      setLeads([]);
      setSelectedStaff([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch {}
    finally { setAssigning(false); }
  };

  const toggleStaff = (id: string) =>
    setSelectedStaff(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const leadsPerStaff = selectedStaff.length ? Math.ceil(leads.length / selectedStaff.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Assignment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Auto-distribute leads equally among selected staff</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-5 py-3 rounded-xl font-medium">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Panel */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" /> Filter Leads
          </h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">City</label>
            <input type="text" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })}
              placeholder="e.g., Mumbai" className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Loan Type</label>
            <select value={filters.loanCategoryId} onChange={e => setFilters({ ...filters, loanCategoryId: e.target.value })}
              className="input-field text-sm">
              <option value="">All Types</option>
              {loanCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={fetchLeads} disabled={loading}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search Leads'}
          </button>
          {leads.length > 0 && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{leads.length}</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">Unassigned leads found</p>
            </div>
          )}
        </div>

        {/* Staff Selection */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-500" /> Select Staff
            {selectedStaff.length > 0 && (
              <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                {selectedStaff.length} selected
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {staff.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No staff members found</p>
            ) : staff.map((s: any) => {
              const checked = selectedStaff.includes(s.id);
              return (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  checked ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <input type="checkbox" checked={checked} onChange={() => toggleStaff(s.id)} className="sr-only" />
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.username}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Assignment Preview */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" /> Assignment Preview
          </h3>

          {selectedStaff.length > 0 && leads.length > 0 ? (
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                {[
                  { label: 'Total Leads', value: leads.length, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Selected Staff', value: selectedStaff.length, color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Leads per Staff', value: `~${leadsPerStaff}`, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                    <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAssign} disabled={assigning}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60">
                  {assigning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                  {assigning ? 'Assigning...' : 'Auto Assign Leads'}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-3">
                <ArrowRight className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {leads.length === 0 ? 'Search for leads first' : 'Select staff members to assign'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
