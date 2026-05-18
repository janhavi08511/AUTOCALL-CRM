import { useState } from 'react';
import { X, Save, Calendar, DollarSign, Building2, User, FileText, CreditCard } from 'lucide-react';
import { staffAPI } from '../../services/api';

interface PendingDetailsFormProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onSaved: (qualification: string) => void;
}

const OCCUPATIONS = ['SALARY', 'SELF_EMPLOYED', 'BUSINESS', 'AGRICULTURE', 'ARMY', 'OTHER'];

const QUALIFICATION_COLORS: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WARM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COLD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function PendingDetailsForm({ leadId, leadName, onClose, onSaved }: PendingDetailsFormProps) {
  const [form, setForm] = useState({
    emiBankName: '',
    existingEmi: '',
    monthlyIncome: '',
    occupation: '',
    loanRequirement: '',
    cibilScore: '',
    notes: '',
    followUpDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await staffAPI.savePendingDetails({ leadId, ...form });
      onSaved(res.data.qualification);
    } catch {
      setError('Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lead Qualification Form</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{leadName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* EMI Bank + Existing EMI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Building2 className="w-4 h-4 inline mr-1" />EMI From Which Bank
              </label>
              <input
                type="text"
                value={form.emiBankName}
                onChange={e => set('emiBankName', e.target.value)}
                placeholder="e.g. HDFC, SBI"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1" />Existing EMI Amount (₹)
              </label>
              <input
                type="number"
                value={form.existingEmi}
                onChange={e => set('existingEmi', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Monthly Income + Loan Requirement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1" />Monthly Income (₹)
              </label>
              <input
                type="number"
                value={form.monthlyIncome}
                onChange={e => set('monthlyIncome', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1" />Loan Requirement (₹)
              </label>
              <input
                type="number"
                value={form.loanRequirement}
                onChange={e => set('loanRequirement', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Occupation + CIBIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User className="w-4 h-4 inline mr-1" />Occupation / Profile
              </label>
              <select
                value={form.occupation}
                onChange={e => set('occupation', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select occupation</option>
                {OCCUPATIONS.map(o => (
                  <option key={o} value={o}>{o.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <CreditCard className="w-4 h-4 inline mr-1" />CIBIL Score
              </label>
              <input
                type="number"
                value={form.cibilScore}
                onChange={e => set('cibilScore', e.target.value)}
                placeholder="300 – 900"
                min="300"
                max="900"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />Follow-Up Date
            </label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={e => set('followUpDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1" />Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about the customer..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Qualification hint */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Auto Qualification Logic:</p>
            <p><span className="font-semibold text-red-600">🔴 HOT</span> — Interested + Monthly Income ≥ ₹25,000</p>
            <p><span className="font-semibold text-yellow-600">🟡 WARM</span> — Interested or Follow-up set</p>
            <p><span className="font-semibold text-blue-600">🔵 COLD</span> — Not Interested</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save & Qualify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
