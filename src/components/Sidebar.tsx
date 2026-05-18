import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Upload, UserCheck, BarChart3, Phone,
  Coffee, Download, Settings, Tag, Eye, FileText, ClipboardList,
  TrendingUp, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { UserRole } from '../App';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const ADMIN_TABS = [
  { id: 'dashboard',       label: 'Dashboard',       icon: LayoutDashboard, group: 'Overview' },
  { id: 'loan-categories', label: 'Loan Categories',  icon: Tag,             group: 'Overview' },
  { id: 'users',           label: 'User Management',  icon: Users,           group: 'Management' },
  { id: 'leads',           label: 'Lead Oversight',   icon: Eye,             group: 'Management' },
  { id: 'calls',           label: 'Call Monitoring',  icon: Phone,           group: 'Management' },
  { id: 'sessions',        label: 'Staff Sessions',   icon: Coffee,          group: 'Management' },
  { id: 'reports',         label: 'Reports & Export', icon: Download,        group: 'Analytics' },
  { id: 'settings',        label: 'Settings',         icon: Settings,        group: 'System' },
];

const MANAGER_TABS = [
  { id: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard, group: 'Overview' },
  { id: 'upload',        label: 'Excel Upload',     icon: Upload,          group: 'Leads' },
  { id: 'assign',        label: 'Task Assignment',  icon: UserCheck,       group: 'Leads' },
  { id: 'qualification', label: 'Qualification',    icon: TrendingUp,      group: 'Leads' },
  { id: 'monitor',       label: 'Staff Monitor',    icon: BarChart3,       group: 'Team' },
  { id: 'reports',       label: 'Reports',          icon: FileText,        group: 'Analytics' },
];

const STAFF_TABS = [
  { id: 'calling', label: 'Auto Calling', icon: Phone,          group: 'Work' },
  { id: 'leads',   label: 'My Leads',     icon: ClipboardList,  group: 'Work' },
  { id: 'history', label: 'Call History', icon: FileText,       group: 'Work' },
];

const ROLE_CONFIG = {
  admin:   { label: 'Admin Portal',   gradient: 'from-purple-600 to-indigo-600', tabs: ADMIN_TABS },
  manager: { label: 'Manager Portal', gradient: 'from-blue-600 to-cyan-600',     tabs: MANAGER_TABS },
  staff:   { label: 'Staff Portal',   gradient: 'from-emerald-600 to-teal-600',  tabs: STAFF_TABS },
};

export function Sidebar({ role, activeTab, onTabChange, collapsed = false, onCollapse, mobileOpen = false, onMobileClose }: SidebarProps) {
  const config = ROLE_CONFIG[role!] ?? ROLE_CONFIG.staff;
  const tabs = config.tabs;

  const groups = [...new Set(tabs.map(t => t.group))];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 border-b border-gray-200/60 dark:border-gray-700/60 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Phone className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
              <p className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">AutoCaller CRM</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{config.label}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {onMobileClose && (
          <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {groups.map(group => (
          <div key={group} className="mb-2">
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2">
                  {group}
                </motion.p>
              )}
            </AnimatePresence>
            {tabs.filter(t => t.group === group).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button key={tab.id} whileTap={{ scale: 0.97 }}
                  onClick={() => { onTabChange(tab.id); onMobileClose?.(); }}
                  title={collapsed ? tab.label : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  } ${collapsed ? 'justify-center' : ''}`}>
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl" />
                  )}
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 relative z-10 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} style={{ width: 18, height: 18 }} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-sm font-medium relative z-10 whitespace-nowrap">
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 relative z-10" layoutId="dot" />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {onCollapse && (
        <div className="p-3 border-t border-gray-200/60 dark:border-gray-700/60">
          <button onClick={() => onCollapse(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 240 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200/60 dark:border-gray-700/60 overflow-hidden flex-shrink-0">
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onMobileClose} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
