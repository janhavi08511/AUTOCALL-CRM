import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Shield, Briefcase, Headphones, Phone, TrendingUp, Users, Zap } from 'lucide-react';
import { User, UserRole } from '../App';
import { authAPI } from '../services/api';

interface LoginProps { onLogin: (user: User) => void; }

const ROLES = [
  { role: 'admin' as UserRole,   label: 'Admin',   icon: Shield,      color: 'from-purple-500 to-indigo-600',  ring: 'ring-purple-500', desc: 'Full system control' },
  { role: 'manager' as UserRole, label: 'Manager', icon: Briefcase,   color: 'from-blue-500 to-cyan-600',      ring: 'ring-blue-500',   desc: 'Team & operations' },
  { role: 'staff' as UserRole,   label: 'Staff',   icon: Headphones,  color: 'from-emerald-500 to-teal-600',   ring: 'ring-emerald-500',desc: 'Calling & tasks' },
];

const DEMO: Record<string, { username: string; password: string }> = {
  admin:   { username: 'admin',    password: 'admin123' },
  manager: { username: 'manager1', password: 'manager123' },
  staff:   { username: 'staff1',   password: 'staff123' },
};

const STATS = [
  { icon: Users,     label: 'Active Users',   value: '2,400+' },
  { icon: Phone,     label: 'Calls Today',    value: '18,500' },
  { icon: TrendingUp,label: 'Conversion',     value: '34.2%'  },
  { icon: Zap,       label: 'Leads Managed',  value: '1.2M+'  },
];

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role && DEMO[role]) {
      setUsername(DEMO[role].username);
      setPassword(DEMO[role].password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      onLogin({ id: user.id, username: user.username, role: user.role.toLowerCase() as UserRole, name: user.name });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex-col justify-between p-12">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AutoCaller CRM</h1>
              <p className="text-indigo-300 text-sm">Smart Loan Management</p>
            </div>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Supercharge Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Loan Sales Team</span>
            </h2>
            <p className="text-indigo-200 mt-4 text-lg leading-relaxed">
              AI-powered lead management, auto-calling workflows, and real-time analytics — all in one platform.
            </p>
          </div>

          {/* Animated stats */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <stat.icon className="w-5 h-5 text-indigo-300 mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-indigo-300 text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-indigo-400 text-sm">
          Trusted by 500+ loan companies across India
        </motion.p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AutoCaller CRM</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {ROLES.map(({ role, label, icon: Icon, color, ring, desc }) => (
              <motion.button key={role} type="button" whileTap={{ scale: 0.97 }}
                onClick={() => handleRoleSelect(role)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedRole === role
                    ? `border-transparent ring-2 ${ring} bg-white dark:bg-gray-800 shadow-lg`
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                <span className="text-xs text-gray-400 text-center leading-tight hidden sm:block">{desc}</span>
                {selectedRole === role && (
                  <motion.div layoutId="role-indicator" className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-5`} />
                )}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="input-field" placeholder="Enter your username" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12" placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="w-5 h-5" />Sign In</>
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="space-y-2">
              {ROLES.map(({ role, label, color }) => (
                <button key={role} type="button" onClick={() => handleRoleSelect(role)}
                  className="w-full flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 px-3 py-2 rounded-lg transition-colors">
                  <span className={`font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{label}</span>
                  <span className="text-gray-400 font-mono">{DEMO[role!]?.username} / {DEMO[role!]?.password}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
