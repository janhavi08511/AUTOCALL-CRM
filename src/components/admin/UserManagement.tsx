import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Search, Shield, Users, UserCheck, Key, Trash2,
  ToggleLeft, ToggleRight, X, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { adminAPI } from '../../services/api';

interface User {
  id: string; username: string; email: string; name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF'; isActive: boolean;
  managerId?: string; manager?: { id: string; name: string };
  _count?: { assignedLeads?: number; callLogs?: number };
  createdAt: string;
}

const ROLE_CONFIG = {
  ADMIN:   { label: 'Admin',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Shield },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Users },
  STAFF:   { label: 'Staff',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: UserCheck },
};

const EMPTY_FORM = { username: '', email: '', name: '', password: '', role: 'STAFF' as const, managerId: '', isActive: true };

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'reset' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [resetPwd, setResetPwd] = useState({ newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        adminAPI.getUsers(undefined),
        adminAPI.getUsers('MANAGER'),
      ]);
      setUsers(uRes.data.users ?? uRes.data ?? []);
      setManagers(mRes.data.users ?? mRes.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };
  const openEdit = (u: User) => {
    setSelected(u);
    setForm({ username: u.username, email: u.email, name: u.name, password: '', role: u.role, managerId: u.managerId || '', isActive: u.isActive });
    setError('');
    setModal('edit');
  };
  const openReset = (u: User) => { setSelected(u); setResetPwd({ newPassword: '', confirm: '' }); setModal('reset'); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') {
        await adminAPI.createUser(form);
      } else if (modal === 'edit' && selected) {
        await adminAPI.updateUser(selected.id, form);
      }
      await fetchAll();
      setModal(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (u: User) => {
    try {
      await adminAPI.updateUser(u.id, { ...u, isActive: !u.isActive });
      await fetchAll();
    } catch {}
  };

  const handleResetPwd = async () => {
    if (resetPwd.newPassword !== resetPwd.confirm) { setError('Passwords do not match'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/admin/users/${selected?.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: resetPwd.newPassword }),
      });
      setModal(null);
    } catch { setError('Reset failed'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = { total: users.length, managers: users.filter(u => u.role === 'MANAGER').length, staff: users.filter(u => u.role === 'STAFF').length, active: users.filter(u => u.isActive).length };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" /><div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage all CRM users and permissions</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: counts.total, color: 'from-indigo-500 to-purple-600' },
          { label: 'Managers', value: counts.managers, color: 'from-blue-500 to-cyan-600' },
          { label: 'Staff', value: counts.staff, color: 'from-emerald-500 to-teal-600' },
          { label: 'Active', value: counts.active, color: 'from-green-500 to-emerald-600' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            <div className={`h-1 rounded-full bg-gradient-to-r ${s.color} mt-3`} style={{ width: `${Math.min((s.value / Math.max(counts.total, 1)) * 100, 100)}%` }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field text-sm w-full sm:w-40">
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50">
              <tr>
                {['User', 'Username', 'Role', 'Status', 'Manager', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.map(u => {
                const RC = ROLE_CONFIG[u.role];
                const RIcon = RC.icon;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-700 dark:text-gray-300 font-mono">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${RC.color}`}>
                        <RIcon className="w-3 h-3" />{RC.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{u.manager?.name || '—'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openReset(u)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggle(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                          {u.isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">No users found.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {modal === 'create' ? 'Add New User' : modal === 'edit' ? 'Edit User' : 'Reset Password'}
                </h3>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {modal !== 'reset' ? (
                  <>
                    {[
                      { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Enter full name' },
                      { label: 'Username', key: 'username', type: 'text', placeholder: 'Enter username' },
                      { label: 'Email', key: 'email', type: 'email', placeholder: 'Enter email' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                        <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.placeholder} className="input-field text-sm" />
                      </div>
                    ))}
                    {modal === 'create' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                          <input type={showPwd ? 'text' : 'password'} value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="Enter password" className="input-field text-sm pr-10" />
                          <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                      <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="input-field text-sm">
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="STAFF">Staff</option>
                      </select>
                    </div>
                    {form.role === 'STAFF' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign Manager</label>
                        <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} className="input-field text-sm">
                          <option value="">No Manager</option>
                          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                      <input type="password" value={resetPwd.newPassword} onChange={e => setResetPwd({ ...resetPwd, newPassword: e.target.value })}
                        placeholder="Enter new password" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                      <input type="password" value={resetPwd.confirm} onChange={e => setResetPwd({ ...resetPwd, confirm: e.target.value })}
                        placeholder="Confirm new password" className="input-field text-sm" />
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setModal(null)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                  <button onClick={modal === 'reset' ? handleResetPwd : handleSave} disabled={saving}
                    className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {modal === 'reset' ? 'Reset Password' : modal === 'create' ? 'Create User' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
