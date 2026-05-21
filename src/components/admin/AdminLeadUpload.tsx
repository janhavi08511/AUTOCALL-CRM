import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Folder, Upload, FileSpreadsheet, X, CheckCircle,
  AlertCircle, Users, Zap, ChevronRight, ArrowLeft
} from 'lucide-react';
import { adminAPI, uploadAPI } from '../../services/api';

interface LoanCategory { id: string; name: string; code: string; description?: string; _count?: { leads: number }; }
interface Staff { id: string; name: string; username: string; }

const FOLDER_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-green-500 to-emerald-600',
  'from-red-500 to-rose-600',
];

export function AdminLeadUpload() {
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LoanCategory | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getLoanCategories(),
      adminAPI.getUsers('STAFF'),
    ]).then(([catRes, staffRes]) => {
      setCategories(catRes.data);
      const staffList = staffRes.data.users ?? staffRes.data ?? [];
      setStaff(staffList);
      setSelectedStaff(staffList.map((s: Staff) => s.id));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = async (f: File) => {
    setError(''); setResult(null);
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) { setError('Please upload a valid Excel file (.xlsx, .xls, .csv)'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!data.length) { setError('File is empty'); setFile(null); return; }
        if (data.length > 50000) { setError('Maximum 50,000 records allowed'); setFile(null); return; }
        setRecordCount(data.length);
        setPreview(data.slice(0, 3));
      } catch { setError('Failed to parse file'); setFile(null); }
    };
    reader.readAsBinaryString(f);
  };

  const handleUpload = async () => {
    if (!selectedCategory || !file) return;
    setUploading(true); setError(''); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loanCategoryId', selectedCategory.id);
      const res = await uploadAPI.uploadExcel(formData);
      const data = res.data;

      // Auto-assign leads to staff if enabled
      if (autoAssign && selectedStaff.length > 0) {
        try {
          await adminAPI.assignLeads({ categoryId: selectedCategory.id, staffIds: selectedStaff });
        } catch {}
      }

      setResult({
        total: data.uploadLog.totalRecords,
        inserted: data.uploadLog.successfulRecords,
        duplicates: data.uploadLog.skippedDuplicates,
        category: data.loanCategory.name,
        assigned: autoAssign && selectedStaff.length > 0,
        staffCount: selectedStaff.length,
      });
      setFile(null); setPreview([]); setRecordCount(0);
      // Refresh categories count
      adminAPI.getLoanCategories().then(r => setCategories(r.data)).catch(() => {});
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const toggleStaff = (id: string) =>
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Upload</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Select a loan category folder → Upload Excel → Leads auto-assign to staff
          </p>
        </div>
        {selectedCategory && (
          <button onClick={() => { setSelectedCategory(null); setFile(null); setPreview([]); setResult(null); setError(''); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to folders
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 — Folder Selection */}
        {!selectedCategory && (
          <motion.div key="folders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
              Choose a loan category folder to upload leads into:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <motion.button key={cat.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedCategory(cat); setResult(null); setError(''); }}
                  className="glass-card p-5 flex flex-col items-center gap-3 hover:shadow-xl transition-all duration-200 group text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${FOLDER_COLORS[i % FOLDER_COLORS.length]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <FolderOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.code}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 font-medium">
                      {cat._count?.leads?.toLocaleString() ?? 0} leads
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </motion.button>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No loan categories found. Create one first.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Upload inside selected folder */}
        {selectedCategory && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-5">

            {/* Selected folder banner */}
            <div className="glass-card p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${FOLDER_COLORS[categories.findIndex(c => c.id === selectedCategory.id) % FOLDER_COLORS.length]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{selectedCategory.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Code: {selectedCategory.code} · {selectedCategory._count?.leads?.toLocaleString() ?? 0} existing leads</p>
              </div>
            </div>

            {/* Error / Result */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
                  <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
                </motion.div>
              )}
              {result && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Upload Successful!</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Rows', value: result.total },
                      { label: 'Inserted', value: result.inserted },
                      { label: 'Duplicates Skipped', value: result.duplicates },
                      { label: 'Staff Assigned', value: result.assigned ? result.staffCount : 'Manual' },
                    ].map(s => (
                      <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {result.assigned && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Leads automatically distributed to {result.staffCount} staff member{result.staffCount > 1 ? 's' : ''}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Upload area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-card p-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Upload Excel File</p>
                  <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
                    <input type="file" id="file-upload" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                    {!file ? (
                      <>
                        <FileSpreadsheet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                          Click to upload
                        </label>
                        <span className="text-gray-500 dark:text-gray-400"> or drag & drop</span>
                        <p className="text-xs text-gray-400 mt-2">.xlsx, .xls, .csv · Max 50,000 rows</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <FileSpreadsheet className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{recordCount.toLocaleString()} records detected</p>
                        </div>
                        <button onClick={() => { setFile(null); setPreview([]); setRecordCount(0); }}
                          className="ml-2 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {preview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Preview (first 3 rows)</p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>{Object.keys(preview[0]).map(k => <th key={k} className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">{k}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {preview.map((row, i) => (
                              <tr key={i}>{Object.values(row).map((v: any, j) => <td key={j} className="py-2 px-3 text-gray-700 dark:text-gray-300">{String(v)}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleUpload} disabled={!file || uploading}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading & Assigning...</>
                    : <><Upload className="w-5 h-5" />Upload to {selectedCategory.name}</>
                  }
                </button>
              </div>

              {/* Auto-assign panel */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Assign</p>
                  </div>
                  <button onClick={() => setAutoAssign(!autoAssign)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${autoAssign ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoAssign ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {autoAssign ? 'Leads will be equally distributed to selected staff after upload.' : 'Leads will be uploaded but not assigned.'}
                </p>

                {autoAssign && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3" /> Select Staff
                      </p>
                      <button onClick={() => setSelectedStaff(selectedStaff.length === staff.length ? [] : staff.map(s => s.id))}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        {selectedStaff.length === staff.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {staff.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No active staff found</p>}
                      {staff.map(s => (
                        <label key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                          <input type="checkbox" checked={selectedStaff.includes(s.id)} onChange={() => toggleStaff(s.id)}
                            className="w-4 h-4 text-indigo-600 rounded" />
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.username}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedStaff.length > 0 && recordCount > 0 && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-xs text-indigo-700 dark:text-indigo-300">
                        ~{Math.ceil(recordCount / selectedStaff.length)} leads per staff member
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
