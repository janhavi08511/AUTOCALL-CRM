import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Download, Eye, AlertTriangle, X } from 'lucide-react';
import { uploadAPI } from '../../services/api';
import * as XLSX from 'xlsx';

interface PreviewRow { row: number; name: string; phone: string; city: string; state?: string; email?: string; valid: boolean; error?: string; }

export function ExcelUpload() {
  const [loanCategories, setLoanCategories] = useState<any[]>([]);
  const [selectedLoanType, setSelectedLoanType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    uploadAPI.getLoanCategories().then(r => setLoanCategories(r.data)).catch(() => {});
  }, []);

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const headers = (rows[0] as string[]).map(h => String(h).toLowerCase().trim());
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const cityIdx = headers.findIndex(h => h.includes('city'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const stateIdx = headers.findIndex(h => h.includes('state'));

      const parsed: PreviewRow[] = rows.slice(1, 201).map((row: any, i) => {
        const phone = String(row[phoneIdx] || '').replace(/\D/g, '');
        const valid = phone.length >= 10;
        return {
          row: i + 2,
          name: row[nameIdx] || 'Unknown',
          phone: phone || '—',
          city: row[cityIdx] || 'Unknown',
          state: row[stateIdx],
          email: row[emailIdx],
          valid,
          error: !valid ? 'Invalid phone number' : undefined,
        };
      }).filter(r => r.phone !== '—' || r.name !== 'Unknown');

      setPreview(parsed);
      setShowPreview(true);
    };
    reader.readAsBinaryString(f);
  };

  const handleFileChange = (f: File) => {
    setFile(f);
    setResult(null);
    parseFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      handleFileChange(f);
    }
  };

  const handleUpload = async () => {
    if (!selectedLoanType || !file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loanCategoryId', selectedLoanType);
      const { data } = await uploadAPI.uploadExcel(formData);
      setResult(data);
      setFile(null);
      setPreview([]);
      setShowPreview(false);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const { data } = await uploadAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'leads-template.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Failed to download template'); }
  };

  const validCount = preview.filter(r => r.valid).length;
  const invalidCount = preview.filter(r => !r.valid).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Excel Upload</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Upload customer leads from Excel or CSV files</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* Step 1: Loan Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs mr-2">1</span>
            Select Loan Type *
          </label>
          <select value={selectedLoanType} onChange={e => setSelectedLoanType(e.target.value)} className="input-field">
            <option value="">— Select Loan Type —</option>
            {loanCategories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {/* Step 2: File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs mr-2">2</span>
            Upload Excel File *
          </label>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
              dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
              file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' :
              'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}>
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => { setFile(null); setPreview([]); setShowPreview(false); }}
                  className="ml-4 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">Drag & drop your file here, or</p>
                <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  browse to upload
                </label>
                <p className="text-xs text-gray-400 mt-2">Supports .xlsx, .xls, .csv — Max 50MB</p>
              </>
            )}
            <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
          </div>
        </div>

        {/* Preview Summary */}
        <AnimatePresence>
          {showPreview && preview.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview ({preview.length} rows)
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4" /> {invalidCount} invalid
                    </span>
                  )}
                </div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                      {['Row', 'Name', 'Phone', 'City', 'Status'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {preview.slice(0, 50).map(r => (
                      <tr key={r.row} className={r.valid ? '' : 'bg-red-50/50 dark:bg-red-900/10'}>
                        <td className="py-2 px-3 text-gray-400">{r.row}</td>
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-gray-700 dark:text-gray-300">{r.phone}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{r.city}</td>
                        <td className="py-2 px-3">
                          {r.valid
                            ? <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Valid</span>
                            : <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{r.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 50 && <p className="text-xs text-gray-400 mt-2 text-center">Showing first 50 of {preview.length} rows</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpload}
            disabled={uploading || !selectedLoanType || !file || validCount === 0}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Upload {validCount > 0 ? `${validCount} Leads` : 'Data'}</>
            )}
          </motion.button>
          <button onClick={downloadTemplate} className="btn-secondary px-5 py-3 flex items-center gap-2">
            <Download className="w-4 h-4" /> Template
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Upload Complete!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white/60 dark:bg-emerald-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.totalRecords || result.insertedRecords}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-xs">Total Records</p>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-emerald-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.insertedRecords || result.successCount}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-xs">Inserted</p>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-emerald-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.skippedDuplicates || result.failedCount || 0}</p>
                  <p className="text-amber-600 dark:text-amber-500 text-xs">Skipped</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
