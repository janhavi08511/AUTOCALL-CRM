import { useState, useEffect } from 'react';
import { Search, Filter, Download, Phone, Calendar, User, MapPin, Tag, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../services/api';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  state?: string;
  loanCategory: {
    id: string;
    name: string;
    code: string;
  };
  stage: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'FOLLOW_UP' | 'CLOSED';
  retryCount: number;
  nextRetryAt?: string;
  isCompleted: boolean;
  uploader: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  _count: {
    callLogs: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface LoanCategory {
  id: string;
  name: string;
  code: string;
}

interface Manager {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
}

export function LeadOversight() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loanCategories, setLoanCategories] = useState<LoanCategory[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    loanType: '',
    city: '',
    manager: '',
    staff: '',
    stage: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchLoanCategories();
    fetchManagers();
    fetchStaff();
  }, [pagination.page, filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.loanType && { loanType: filters.loanType }),
        ...(filters.city && { city: filters.city }),
        ...(filters.manager && { manager: filters.manager }),
        ...(filters.staff && { staff: filters.staff }),
        ...(filters.stage && { stage: filters.stage }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });
      setLeads(res.data.leads);
      setPagination(prev => ({ ...prev, total: res.data.total, totalPages: res.data.totalPages }));
    } catch {}
    finally { setLoading(false); }
  };

  const fetchLoanCategories = async () => {
    try {
      const res = await adminAPI.getLoanCategories();
      setLoanCategories(res.data);
    } catch {}
  };

  const fetchManagers = async () => {
    try {
      const res = await adminAPI.getUsers('MANAGER');
      setManagers(res.data.users ?? res.data ?? []);
    } catch {}
  };

  const fetchStaff = async () => {
    try {
      const res = await adminAPI.getUsers('STAFF');
      setStaff(res.data.users ?? res.data ?? []);
    } catch {}
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeads();
  };

  const handleExport = async () => {
    try {
      const res = await adminAPI.getLeads({
        ...(filters.loanType && { loanType: filters.loanType }),
        ...(filters.city && { city: filters.city }),
        ...(filters.manager && { manager: filters.manager }),
        ...(filters.staff && { staff: filters.staff }),
        ...(filters.stage && { stage: filters.stage }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        limit: 10000
      });
      const leads = res.data.leads;
      const csv = [
        ['Name','Phone','City','State','Loan Type','Stage','Assigned To','Created'].join(','),
        ...leads.map((l: any) => [
          l.name, l.phone, l.city, l.state || '', l.loanCategory.name,
          l.stage, l.assignee?.name || 'Unassigned',
          new Date(l.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Failed to export leads'); }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'CONTACTED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'INTERESTED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'NOT_INTERESTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'FOLLOW_UP':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'CLOSED':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const maskPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{5})\d{5}(\d{1})/, '$1XXXXX$2');
  };

  // Filter leads based on search
  const filteredLeads = leads.filter(lead => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.city.toLowerCase().includes(searchLower) ||
      lead.loanCategory.name.toLowerCase().includes(searchLower)
    );
  });

  if (loading && leads.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Oversight</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor all leads with read-only access
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
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

          {/* Manager */}
          <div>
            <select
              value={filters.manager}
              onChange={(e) => handleFilterChange('manager', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Managers</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
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

          {/* City */}
          <div>
            <input
              type="text"
              placeholder="City..."
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Stage */}
          <div>
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Stages</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
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
                loanType: '',
                city: '',
                manager: '',
                staff: '',
                stage: '',
                startDate: '',
                endDate: ''
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

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Location
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Loan Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stage
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned To
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Calls
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {lead.name}
                      </div>
                      {lead.email && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {lead.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-mono text-sm text-gray-900 dark:text-white">
                      {maskPhoneNumber(lead.phone)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {lead.city}
                      {lead.state && `, ${lead.state}`}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        <Tag className="w-3 h-3 mr-1" />
                        {lead.loanCategory.code}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {lead.loanCategory.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {lead.assignee ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {lead.assignee.name}
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {lead._count.callLogs}
                      </div>
                      {lead.retryCount > 0 && (
                        <div className="text-xs text-gray-500">
                          Retries: {lead.retryCount}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              No leads found matching your criteria
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
            {pagination.total} leads
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
