import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bell, Menu, Search, LogOut, User, ChevronDown } from 'lucide-react';
import { User as UserType } from '../App';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onMenuClick?: () => void;
}

const ROLE_BADGE = {
  admin:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  staff:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function Header({ user, onLogout, darkMode, toggleDarkMode, onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: '5 new leads assigned to your team', time: '2m ago', unread: true },
    { id: 2, text: 'Staff1 has been inactive for 30 mins', time: '15m ago', unread: true },
    { id: 3, text: 'Monthly report is ready to download', time: '1h ago', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 px-4 lg:px-6 h-16 flex items-center gap-4">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search leads, staff, reports..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Dark mode */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleDarkMode}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <AnimatePresence mode="wait">
            {darkMode
              ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun className="w-5 h-5 text-amber-500" /></motion.div>
              : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /></motion.div>
            }
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card rounded-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${n.unread ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium capitalize ${ROLE_BADGE[user.role!] ?? ''}`}>{user.role}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role} Account</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" /> Profile Settings
                  </button>
                  <button onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close */}
      {(showUserMenu || showNotifications) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowUserMenu(false); setShowNotifications(false); }} />
      )}
    </header>
  );
}
