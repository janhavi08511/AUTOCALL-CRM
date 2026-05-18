import { useState } from 'react';
import { Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

export function AdminReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterManager, setFilterManager] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const reportData = [
    {
      id: '1',
      date: '2026-02-08',
      staff: 'Jane Staff',
      manager: 'John Manager',
      totalCalls: 145,
      connected: 98,
      notConnected: 32,
      rejected: 15,
    },
    {
      id: '2',
      date: '2026-02-08',
      staff: 'Mike Staff',
      manager: 'John Manager',
      totalCalls: 132,
      connected: 89,
      notConnected: 28,
      rejected: 15,
    },
    {
      id: '3',
      date: '2026-02-08',
      staff: 'Tom Staff',
      manager: 'Sarah Manager',
      totalCalls: 128,
      connected: 85,
      notConnected: 30,
      rejected: 13,
    },
    {
      id: '4',
      date: '2026-02-07',
      staff: 'Jane Staff',
      manager: 'John Manager',
      totalCalls: 138,
      connected: 95,
      notConnected: 28,
      rejected: 15,
    },
  ];

  const handleExport = (format: 'excel' | 'csv') => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate and export call reports
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manager
            </label>
            <select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Managers</option>
              <option value="john">John Manager</option>
              <option value="sarah">Sarah Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Staff
            </label>
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Staff</option>
              <option value="jane">Jane Staff</option>
              <option value="mike">Mike Staff</option>
              <option value="tom">Tom Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="connected">Connected</option>
              <option value="notConnected">Not Connected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">543</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Connected</p>
          <p className="text-3xl font-bold text-green-600">367</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Not Connected</p>
          <p className="text-3xl font-bold text-red-600">118</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Success Rate</p>
          <p className="text-3xl font-bold text-indigo-600">67.6%</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Staff Member
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Manager
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Calls
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Connected
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Not Connected
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rejected
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => {
                const successRate = ((row.connected / row.totalCalls) * 100).toFixed(1);
                return (
                  <tr
                    key={row.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-4 px-4 text-gray-900 dark:text-white">{row.date}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white">{row.staff}</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{row.manager}</td>
                    <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                      {row.totalCalls}
                    </td>
                    <td className="py-4 px-4 text-right text-green-600 dark:text-green-400">
                      {row.connected}
                    </td>
                    <td className="py-4 px-4 text-right text-red-600 dark:text-red-400">
                      {row.notConnected}
                    </td>
                    <td className="py-4 px-4 text-right text-orange-600 dark:text-orange-400">
                      {row.rejected}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
