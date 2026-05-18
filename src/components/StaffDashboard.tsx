import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AutoCalling } from './staff/AutoCalling';
import { CallHistory } from './staff/CallHistory';
import { StaffLeads } from './staff/StaffLeads';
import { User } from '../App';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function StaffDashboard({ user, onLogout, darkMode, toggleDarkMode }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState('calling');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role="staff" activeTab={activeTab} onTabChange={setActiveTab}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          {activeTab === 'calling' && <AutoCalling />}
          {activeTab === 'leads'   && <StaffLeads />}
          {activeTab === 'history' && <CallHistory />}
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 flex z-30">
          {[
            { id: 'calling', label: 'Calling',  icon: '📞' },
            { id: 'leads',   label: 'Leads',    icon: '📋' },
            { id: 'history', label: 'History',  icon: '📊' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
