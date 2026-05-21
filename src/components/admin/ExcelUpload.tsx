import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { uploadAPI } from '../../services/api';

interface LoanCategory {
  id: string;
  name: string;
  code: string;
}

interface UploadResult {
  totalRecords: number;
  insertedRecords: number;
  skippedDuplicates: number;
  loanCategory: {
    name: string;
    code: string;
  };
}

export function ExcelUpload() {
  const [loanCategories, setLoanCategories] = useState<LoanCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    uploadAPI.getLoanCategories()
      .then(res => { if (Array.isArray(res.data)) setLoanCategories(res.data); })
      .catch(() => {});
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setSuccess(null);

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, .csv)');
      return;
    }

    setFile(selectedFile);

    // Parse file for preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (data) {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setError('File is empty');
            setFile(null);
            return;
          }

          if (jsonData.length > 50000) {
            setError('Maximum 50,000 records allowed per file');
            setFile(null);
            return;
          }

          setRecordCount(jsonData.length);
          setPreview(jsonData.slice(0, 5));
        }
      } catch (err) {
        setError('Failed to parse file');
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedCategory) {
      setError('Please select a loan category');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loanCategoryId', selectedCategory);

      const res = await uploadAPI.uploadExcel(formData);
      const result = res.data;
      setSuccess({
        totalRecords: result.uploadLog.totalRecords,
        insertedRecords: result.uploadLog.successfulRecords,
        skippedDuplicates: result.uploadLog.skippedDuplicates,
        loanCategory: result.loanCategory
      });
      setFile(null);
      setPreview([]);
      setRecordCount(0);
      setSelectedCategory('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = selectedCategory && file && !uploading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Excel Upload</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Upload lead data from Excel files</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Upload Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 dark:text-red-400 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Upload Successful</h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              {success.insertedRecords} of {success.totalRecords} records uploaded to {success.loanCategory.name}
              {success.skippedDuplicates > 0 && ` (${success.skippedDuplicates} duplicates skipped)`}
            </p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 dark:text-green-400 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Loan Category Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Loan Category <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select loan category</option>
          {loanCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.code})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          All leads will be tagged with this loan category
        </p>
      </div>

      {/* File Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Upload File <span className="text-red-500">*</span>
        </label>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {!file ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
              >
                Click to upload
              </label>
              <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Excel files (.xlsx, .xls, .csv) up to 50MB
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {recordCount.toLocaleString()} records
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setRecordCount(0);
                }}
                className="ml-4 text-red-600 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span>Maximum 50,000 records per file. Duplicate phone numbers will be skipped.</span>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Preview (First 5 records)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="py-2 px-3 text-gray-900 dark:text-white">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!canUpload}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            canUpload
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <Upload className="w-5 h-5" />
          {uploading ? 'Uploading...' : 'Upload Leads'}
        </button>
      </div>
    </div>
  );
}
