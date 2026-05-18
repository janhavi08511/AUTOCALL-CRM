import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Database, Palette, Save, CheckCircle2 } from 'lucide-react';

export function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    retryAttempt1Hours: 2,
    retryAttempt2Days: 1,
    maxRetryAttempts: 3,
    hotIncomeThreshold: 25000,
    hotCibilThreshold: 700,
    sessionTimeoutHours: 24,
    enableNotifications: true,
    enableAuditLog: true,
    enableMobileMasking: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      title: 'Retry Logic Engine',
      icon: Database,
      color: 'from-blue-500 to-indigo-600',
      fields: [
        { key: 'retryAttempt1Hours', label: 'Attempt 1 Retry (hours)', type: 'number', min: 1, max: 24 },
        { key: 'retryAttempt2Days', label: 'Attempt 2 Retry (days)', type: 'number', min: 1, max: 7 },
        { key: 'maxRetryAttempts', label: 'Max Retry Attempts', type: 'number', min: 1, max: 10 },
      ],
    },
    {
      title: 'Lead Qualification Thresholds',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      fields: [
        { key: 'hotIncomeThreshold', label: 'HOT Lead Min Income (₹)', type: 'number', min: 0 },
        { key: 'hotCibilThreshold', label: 'HOT Lead Min CIBIL Score', type: 'number', min: 300, max: 900 },
      ],
    },
    {
      title: 'Security Settings',
      icon: Shield,
      color: 'from-purple-500 to-violet-600',
      fields: [
        { key: 'sessionTimeoutHours', label: 'Session Timeout (hours)', type: 'number', min: 1, max: 168 },
      ],
    },
  ];

  const toggles = [
    { key: 'enableNotifications', label: 'Enable Notifications', desc: 'Push alerts for follow-ups and retries' },
    { key: 'enableAuditLog', label: 'Enable Audit Logging', desc: 'Track all user actions in the system' },
    { key: 'enableMobileMasking', label: 'Mobile Number Masking', desc: 'Mask phone numbers until staff clicks reveal' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure CRM behavior and automation rules</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            saved ? 'bg-emerald-600 text-white' : 'btn-primary'
          }`}>
          {saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Settings</>}
        </motion.button>
      </div>

      {sections.map(section => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(settings as any)[f.key]}
                    min={f.min}
                    max={f.max}
                    onChange={e => setSettings(s => ({ ...s, [f.key]: Number(e.target.value) }))}
                    className="input-field text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Toggle Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Feature Toggles</h3>
        </div>
        <div className="space-y-4">
          {toggles.map(t => (
            <div key={t.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={(settings as any)[t.key]}
                  onChange={e => setSettings(s => ({ ...s, [t.key]: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Retry Logic Info */}
      <div className="glass-card p-6 border-l-4 border-indigo-500">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Retry Logic Summary</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>🔁 <strong>Attempt 1:</strong> Retry after {settings.retryAttempt1Hours} hours if not connected</p>
          <p>🔁 <strong>Attempt 2:</strong> Retry after {settings.retryAttempt2Days} day(s) if still not connected</p>
          <p>🔒 <strong>Attempt {settings.maxRetryAttempts}:</strong> Lead automatically closed after max retries</p>
        </div>
      </div>
    </div>
  );
}
