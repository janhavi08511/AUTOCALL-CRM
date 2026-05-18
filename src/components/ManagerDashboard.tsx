import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ManagerDashboardView } from './manager/ManagerDashboardView';
import { ExcelUpload } from './manager/ExcelUpload';
import { TaskAssignment } from './manager/TaskAssignment';
import { StaffMonitor } from './manager/StaffMonitor';
import { ManagerReports } from './manager/ManagerReports';
import { QualificationDashboard } from './manager/QualificationDashboard';
import { User } from '../App';

interface ManagerDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function ManagerDashboard({ user, onLogout, darkMode, toggleDarkMode }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role="manager" activeTab={activeTab} onTabChange={setActiveTab}
        collapsed={collapsed} onCollapse={setCollapsed}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'dashboard'     && <ManagerDashboardView />}
          {activeTab === 'upload'        && <ExcelUpload />}
          {activeTab === 'assign'        && <TaskAssignment />}
          {activeTab === 'qualification' && <QualificationDashboard />}
          {activeTab === 'monitor'       && <StaffMonitor />}
          {activeTab === 'reports'       && <ManagerReports />}
        </main>
      </div>
    </div>
  );
}
