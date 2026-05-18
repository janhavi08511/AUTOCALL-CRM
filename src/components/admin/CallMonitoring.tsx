import { useState, useEffect } from 'react';
import { Search, Filter, Download, Phone, PhoneCall, PhoneMissed, Clock, User, Calendar, Tag, RefreshCw } from 'lucide-react';

interface CallLog {
  id: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    loanCategory: {
      id: string;
      name: string;
      code: string;
    };
  };
  staff: {
    id: string;
    name: string;
  };
  callDuration?: number;
  callResult: 'CONNECTED' | 'NOT_CONNECTED' | 'BUSY' | 'NO_ANSWER' | 'WRONG_NUMBER' | 'NOT_INTERESTED';
  customerResponse?: string;
  attemptNumber: number;
  notes?: string;
  createdAt: string;
}

interface Staff {
  id: string;
  name: string;
}

interface LoanCategory {
  id: string;
  name: string;
  code: string;
}

export function CallMonitoring() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loanCategories, setLoanCategories] = useState<LoanCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    staff: '',
    loanType: '',
    date: '',
    callResult: ''
  });

  // Fetch data
  useEffect(() => {
    fetchCallLogs();
    fetchStaff();
    fetchLoanCategories();
  }, [pagination.page, filters]);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.staff && { staff: filters.staff }),
        ...(filters.loanType && { loanType: filters.loanType }),
        ...(filters.date && { date: filters.date }),
        ...(filters.callResult && { callResult: filters.callResult })
      });

      const response = await fetch(`/api/admin/call-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.callLogs);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=STAFF', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchLoanCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/loan-categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoanCategories(data);
      }
    } catch (error) {
      console.error('Error fetching loan categories:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCallLogs();
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        ...(filters.staff && { staff: filters.staff }),
        ...(filters.loanType && { loanType: filters.loanType }),
        ...(filters.date && { date: filters.date }),
        ...(filters.callResult && { callResult: filters.callResult }),
        export: 'true'
      });

      const response = await fetch(`/api/admin/call-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-logs-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting call logs:', error);
      alert('Failed to export call logs');
    }
  };

  const getCallResultIcon = (result: string) => {
    switch (result) {
      case 'CONNECTED':
        return <PhoneCall className="w-4 h-4" />;
      case 'NOT_CONNECTED':
      case 'NO_ANSWER':
      case 'BUSY':
      case 'WRONG_NUMBER':
        return <PhoneMissed className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getCallResultColor = (result: string) => {
    switch (result) {
      case 'CONNECTED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'NOT_CONNECTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'BUSY':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'NO_ANSWER':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'WRONG_NUMBER':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'NOT_INTERESTED':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const maskPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{5})\d{5}(\d{1})/, '$1XXXXX$2');
  };

  // Filter call logs based on search
  const filteredCallLogs = callLogs.filter(log => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      log.lead.name.toLowerCase().includes(searchLower) ||
      log.lead.phone.includes(searchLower) ||
      log.staff.name.toLowerCase().includes(searchLower) ||
      log.lead.loanCategory.name.toLowerCase().includes(searchLower) ||
      (log.customerResponse && log.customerResponse.toLowerCase().includes(searchLower))
    );
  });

  if (loading && callLogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Monitoring & Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor all call activities and results
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search call logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Staff */}
          <div>
            <select
              value={filters.staff}
              onChange={(e) => handleFilterChange('staff', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Staff</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Type */}
          <div>
            <select
              value={filters.loanType}
              onChange={(e) => handleFilterChange('loanType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Loan Types</option>
              {loanCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Call Result */}
          <div>
            <select
              value={filters.callResult}
              onChange={(e) => handleFilterChange('callResult', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Results</option>
              <option value="CONNECTED">Connected</option>
              <option value="NOT_CONNECTED">Not Connected</option>
              <option value="BUSY">Busy</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="WRONG_NUMBER">Wrong Number</option>
              <option value="NOT_INTERESTED">Not Interested</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({
                search: '',
                staff: '',
                loanType: '',
                date: '',
                callResult: ''
              });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Staff
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Loan Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Result
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Duration
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attempt
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Response
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCallLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.lead.name}
                      </div>
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {maskPhoneNumber(log.lead.phone)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                      <User className="w-3 h-3 text-gray-400" />
                      {log.staff.name}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        <Tag className="w-3 h-3 mr-1" />
                        {log.lead.loanCategory.code}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {log.lead.loanCategory.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCallResultColor(log.callResult)}`}>
                      {getCallResultIcon(log.callResult)}
                      {log.callResult.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {formatDuration(log.callDuration)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      Attempt #{log.attemptNumber}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.customerResponse || '-'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCallLogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              No call logs found matching your criteria
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} call logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
