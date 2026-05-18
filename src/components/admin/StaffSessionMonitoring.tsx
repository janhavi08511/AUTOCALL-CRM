import { useState, useEffect } from 'react';
import { Users, Clock, Coffee, Wifi, WifiOff, RefreshCw, Calendar, TrendingUp } from 'lucide-react';

interface StaffSession {
  id: string;
  staff: {
    id: string;
    name: string;
  };
  loginTime: string;
  logoutTime?: string;
  totalWorkTime?: number;
  totalBreakTime?: number;
  status: 'ACTIVE' | 'ON_BREAK' | 'OFFLINE';
  createdAt: string;
}

interface StaffStatus {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ON_BREAK' | 'OFFLINE';
  loginTime?: string;
  totalWorkTime?: number;
  totalBreakTime?: number;
}

export function StaffSessionMonitoring() {
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [staffStatus, setStaffStatus] = useState<StaffStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'status' | 'sessions'>('status');

  useEffect(() => {
    fetchSessions();
    fetchStaffStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStaffStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/staff-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching staff sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/staff-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaffStatus(data);
      }
    } catch (error) {
      console.error('Error fetching staff status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Wifi className="w-4 h-4" />;
      case 'ON_BREAK':
        return <Coffee className="w-4 h-4" />;
      case 'OFFLINE':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'ON_BREAK':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'OFFLINE':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusCounts = () => {
    const counts = {
      active: staffStatus.filter(s => s.status === 'ACTIVE').length,
      onBreak: staffStatus.filter(s => s.status === 'ON_BREAK').length,
      offline: staffStatus.filter(s => s.status === 'OFFLINE').length
    };
    return counts;
  };

  const counts = getStatusCounts();

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Session Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time staff activity and session tracking
          </p>
        </div>
        <button
          onClick={() => {
            fetchSessions();
            fetchStaffStatus();
          }}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Staff</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Break</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{counts.onBreak}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Coffee className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{counts.offline}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('status')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'status'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Current Status
          </button>
          <button
            onClick={() => setViewMode('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'sessions'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Session History
          </button>
        </div>
      </div>

      {/* Current Status View */}
      {viewMode === 'status' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Staff Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Login Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Work Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Break Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {staffStatus.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {staff.name}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                        {getStatusIcon(staff.status)}
                        {staff.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatTime(staff.loginTime)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        {formatDuration(staff.totalWorkTime)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <Coffee className="w-3 h-3 text-yellow-500" />
                        {formatDuration(staff.totalBreakTime)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {staffStatus.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                No staff status data available
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session History View */}
      {viewMode === 'sessions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Staff Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Login Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Logout Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Work Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Break Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Session Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {session.staff.name}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(session.loginTime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(session.loginTime)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {session.logoutTime ? (
                          <>
                            <div>{formatTime(session.logoutTime)}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(session.logoutTime).toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        {formatDuration(session.totalWorkTime)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <Coffee className="w-3 h-3 text-yellow-500" />
                        {formatDuration(session.totalBreakTime)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                No session history available
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
