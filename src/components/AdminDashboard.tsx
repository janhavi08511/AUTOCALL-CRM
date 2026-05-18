import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { UserManagement } from './admin/UserManagement';
import { LoanCategoryManagement } from './admin/LoanCategoryManagement';
import { ExcelUpload } from './admin/ExcelUpload';
import { LeadOversight } from './admin/LeadOversight';
import { CallMonitoring } from './admin/CallMonitoring';
import { StaffSessionMonitoring } from './admin/StaffSessionMonitoring';
import { ReportsExport } from './admin/ReportsExport';
import { AdminSettings } from './admin/AdminSettings';
import { User } from '../App';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function AdminDashboard({ user, onLogout, darkMode, toggleDarkMode }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role="admin" activeTab={activeTab} onTabChange={setActiveTab}
        collapsed={collapsed} onCollapse={setCollapsed}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'dashboard'       && <AdminDashboardView />}
          {activeTab === 'loan-categories' && <LoanCategoryManagement />}
          {activeTab === 'users'           && <UserManagement />}
          {activeTab === 'leads'           && <LeadOversight />}
          {activeTab === 'calls'           && <CallMonitoring />}
          {activeTab === 'sessions'        && <StaffSessionMonitoring />}
          {activeTab === 'reports'         && <ReportsExport />}
          {activeTab === 'settings'        && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
