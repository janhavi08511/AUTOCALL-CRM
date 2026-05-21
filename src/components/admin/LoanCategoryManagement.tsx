import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Eye, EyeOff, Search, X, Tag } from 'lucide-react';
import { adminAPI } from '../../services/api';

interface LoanCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    leads: number;
  };
}

export function LoanCategoryManagement() {
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LoanCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // Fetch loan categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await adminAPI.getLoanCategories();
      setCategories(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleCreateCategory = async () => {
    try {
      await adminAPI.createLoanCategory(formData);
      await fetchCategories();
      setShowCreateModal(false); resetForm();
    } catch (e: any) { alert(e?.response?.data?.error || 'Failed to create category'); }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    try {
      await adminAPI.updateLoanCategory(selectedCategory.id, formData);
      await fetchCategories();
      setShowEditModal(false); resetForm(); setSelectedCategory(null);
    } catch (e: any) { alert(e?.response?.data?.error || 'Failed to update category'); }
  };

  const handleToggleStatus = async (category: LoanCategory) => {
    try {
      await adminAPI.updateLoanCategory(category.id, { ...category, isActive: !category.isActive });
      await fetchCategories();
    } catch (e: any) { alert(e?.response?.data?.error || 'Failed to update category'); }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
  };

  const openEditModal = (category: LoanCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      isActive: category.isActive
    });
    setShowEditModal(true);
  };

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && category.isActive) ||
                         (filterActive === 'inactive' && !category.isActive);

    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" /><div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage loan types for lead classification</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </motion.button>
      </div>

      <div className="glass-card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)} className="input-field text-sm w-36">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50">
              <tr>
                {['Category', 'Code', 'Description', 'Total Leads', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredCategories.map((cat, i) => (
                <motion.tr key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{cat.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-semibold">{cat.code}</span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="py-3.5 px-4 text-sm font-semibold text-gray-900 dark:text-white">{cat._count.leads.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <button onClick={() => handleToggleStatus(cat)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        cat.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {cat.isActive ? <><Eye className="w-3 h-3" />Active</> : <><EyeOff className="w-3 h-3" />Inactive</>}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button onClick={() => openEditModal(cat)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">No loan categories found.</div>
        )}
      </div>

      {/* Unified Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {showCreateModal ? 'Create Loan Category' : 'Edit Loan Category'}
                </h3>
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[{ key: 'name', label: 'Category Name *', placeholder: 'e.g., Car Loan' }, { key: 'code', label: 'Code *', placeholder: 'e.g., CAR_LOAN' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                    <input type="text" value={(formData as any)[f.key]}
                      onChange={e => setFormData({ ...formData, [f.key]: f.key === 'code' ? e.target.value.toUpperCase() : e.target.value })}
                      placeholder={f.placeholder} className="input-field text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2} placeholder="Optional description" className="input-field text-sm resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (available for uploads)</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                  <button onClick={showCreateModal ? handleCreateCategory : handleUpdateCategory}
                    disabled={!formData.name || !formData.code} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
                    {showCreateModal ? 'Create' : 'Update'}
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
