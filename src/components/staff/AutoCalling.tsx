import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Phone, PhoneOff, Clock, Coffee, CheckCircle2,
  ChevronRight, Flame, Thermometer, Snowflake, Eye, EyeOff,
  User, MapPin, Tag, RotateCcw, Mic, MicOff
} from 'lucide-react';
import { PendingDetailsForm } from './PendingDetailsForm';
import { staffAPI } from '../../services/api';

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  loanCategory?: { name: string; code: string };
  attempt: number;
  stage: string;
}

const QUAL_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
  HOT:  { label: 'HOT',  icon: Flame,       cls: 'badge-hot' },
  WARM: { label: 'WARM', icon: Thermometer,  cls: 'badge-warm' },
  COLD: { label: 'COLD', icon: Snowflake,    cls: 'badge-cold' },
};

export function AutoCalling() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [workSec, setWorkSec] = useState(0);
  const [breakSec, setBreakSec] = useState(0);
  const [callSec, setCallSec] = useState(0);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [fullPhone, setFullPhone] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [lastQual, setLastQual] = useState<string | null>(null);
  const [callResult, setCallResult] = useState('');
  const [customerResponse, setCustomerResponse] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [todayStats, setTodayStats] = useState({ total: 0, connected: 0, notConnected: 0 });
  const [queue, setQueue] = useState<Lead[]>([]);
  const [loadingLead, setLoadingLead] = useState(false);
  const callTimerRef = useRef<any>(null);

  // Timers
  useEffect(() => {
    const t = setInterval(() => {
      if (isOnBreak) setBreakSec(s => s + 1);
      else setWorkSec(s => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isOnBreak]);

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => setCallSec(s => s + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallSec(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isCallActive]);

  // Load leads
  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  const loadLeads = async () => {
    setLoadingLead(true);
    try {
      const res = await staffAPI.getLeads({ stage: 'NEW', limit: 10 });
      const leads = res.data.leads ?? [];
      setQueue(leads);
      if (leads.length > 0 && !currentLead) {
        setCurrentLead(leads[0]);
        setIsCallActive(true);
      }
    } catch {}
    finally { setLoadingLead(false); }
  };

  const loadStats = async () => {
    try {
      const res = await staffAPI.getDashboard();
      const d = res.data;
      setTodayStats({ total: d.callsToday || 0, connected: 0, notConnected: 0 });
    } catch {}
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const revealPhone = async () => {
    if (!currentLead) return;
    try {
      const res = await staffAPI.getLeadPhone(currentLead.id);
      setFullPhone(res.data.phone);
      setShowPhone(true);
    } catch {
      setFullPhone(currentLead.phone);
      setShowPhone(true);
    }
  };

  const handleCallConnected = () => {
    setIsCallActive(false);
    setShowForm(true);
  };

  const handleNotConnected = async () => {
    if (!currentLead) return;
    setSubmitting(true);
    try {
      await staffAPI.updateCallStatus({
        leadId: currentLead.id,
        callResult: 'NOT_CONNECTED',
        customerResponse: '',
        notes: '',
        callDuration: callSec,
      });
      setTodayStats(s => ({ ...s, total: s.total + 1, notConnected: s.notConnected + 1 }));
    } catch {}
    finally { setSubmitting(false); }
    moveNext();
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead || !callResult) return;
    setSubmitting(true);
    try {
      await staffAPI.updateCallStatus({
        leadId: currentLead.id,
        callResult,
        customerResponse,
        notes,
        callDuration: callSec,
      });
      setTodayStats(s => ({ ...s, total: s.total + 1, connected: s.connected + 1 }));
      setShowForm(false);
      setShowPendingForm(true);
    } catch {}
    finally { setSubmitting(false); }
  };

  const moveNext = () => {
    setShowForm(false);
    setShowPendingForm(false);
    setShowPhone(false);
    setFullPhone('');
    setCallResult('');
    setCustomerResponse('');
    setNotes('');
    setIsCallActive(false);
    const idx = queue.findIndex(l => l.id === currentLead?.id);
    const next = queue[idx + 1];
    if (next) {
      setTimeout(() => { setCurrentLead(next); setIsCallActive(true); }, 800);
    } else {
      setCurrentLead(null);
    }
  };

  const maskedPhone = currentLead?.phone
    ? currentLead.phone.replace(/(\d{5})\d{5}/, '$1XXXXX')
    : '';

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-none">
      {/* Pending Details Modal */}
      <AnimatePresence>
        {showPendingForm && currentLead && (
          <PendingDetailsForm
            leadId={currentLead.id}
            leadName={currentLead.name}
            onClose={moveNext}
            onSaved={(qual) => { setLastQual(qual); moveNext(); }}
          />
        )}
      </AnimatePresence>

      {/* Qualification Toast */}
      <AnimatePresence>
        {lastQual && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              lastQual === 'HOT' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
              lastQual === 'WARM' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
              'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Lead qualified as <strong className="ml-1">{lastQual}</strong>
            <button onClick={() => setLastQual(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/25">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80 font-medium">Work Timer</span>
            {!isOnBreak && <span className="ml-auto flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Active</span>}
          </div>
          <p className="text-2xl font-bold font-mono">{fmt(workSec)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/25">
          <div className="flex items-center gap-2 mb-3">
            <Coffee className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80 font-medium">Break Timer</span>
            {isOnBreak && <span className="ml-auto flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse" />Break</span>}
          </div>
          <p className="text-2xl font-bold font-mono">{fmt(breakSec)}</p>
        </div>

        <div className="glass-card p-5 flex flex-col justify-center">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
            {isOnBreak ? '▶ Resume Work' : '⏸ Take Break'}
          </p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isOnBreak} onChange={() => setIsOnBreak(!isOnBreak)} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500" />
          </label>
        </div>
      </div>

      {/* Main Calling Interface */}
      {!isOnBreak ? (
        <>
          {currentLead ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden">
              {/* Call Header */}
              <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                </div>
                <div className="relative flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ${isCallActive ? 'animate-pulse' : ''}`}>
                    {isCallActive ? <Phone className="w-8 h-8" /> : <PhoneOff className="w-8 h-8 opacity-60" />}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{currentLead.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-indigo-200 text-sm">
                        {showPhone ? fullPhone : maskedPhone}
                      </span>
                      <button onClick={showPhone ? () => setShowPhone(false) : revealPhone}
                        className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                        {showPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {showPhone && (
                        <a href={`tel:${fullPhone}`}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-400 rounded-lg text-xs font-semibold transition-colors">
                          <Phone className="w-3 h-3" /> Call Now
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-semibold">
                      Attempt #{currentLead.attempt || 1}
                    </div>
                    {isCallActive && (
                      <p className="text-xs text-indigo-200 mt-1 font-mono">{fmt(callSec)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">City</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentLead.city || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Loan Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentLead.loanCategory?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Stage</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentLead.stage || 'NEW'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!showForm && isCallActive && (
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleCallConnected}
                      className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/25 transition-all">
                      <CheckCircle2 className="w-5 h-5" /> Connected
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleNotConnected} disabled={submitting}
                      className="py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-red-500/25 transition-all disabled:opacity-60">
                      <PhoneOff className="w-5 h-5" /> Not Connected
                    </motion.button>
                  </div>
                )}

                {/* Call Details Form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleSubmitForm} className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Call Details</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Call Result *</label>
                          <select required value={callResult} onChange={e => setCallResult(e.target.value)}
                            className="input-field text-sm">
                            <option value="">Select result...</option>
                            <option value="CONNECTED">Connected</option>
                            <option value="NOT_CONNECTED">Not Connected</option>
                            <option value="BUSY">Busy</option>
                            <option value="NO_ANSWER">No Answer</option>
                            <option value="WRONG_NUMBER">Wrong Number</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Customer Response</label>
                          <select value={customerResponse} onChange={e => setCustomerResponse(e.target.value)}
                            className="input-field text-sm">
                            <option value="">Select response...</option>
                            <option value="INTERESTED">Interested</option>
                            <option value="NOT_INTERESTED">Not Interested</option>
                            <option value="FOLLOW_UP">Follow-up Required</option>
                            <option value="CALLBACK">Callback Requested</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                          placeholder="Quick notes about the call..."
                          className="input-field text-sm resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowForm(false)}
                          className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting}
                          className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                          Submit & Next
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Calls Completed!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-5">Great job! You've completed all assigned calls.</p>
              <button onClick={loadLeads} className="btn-primary flex items-center gap-2 mx-auto">
                <RotateCcw className="w-4 h-4" /> Load More Leads
              </button>
            </motion.div>
          )}

          {/* Today's Progress */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Today's Progress</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Calls', value: todayStats.total, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Connected', value: todayStats.connected, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Not Connected', value: todayStats.notConnected, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                { label: 'Success Rate', value: todayStats.total ? `${((todayStats.connected / todayStats.total) * 100).toFixed(0)}%` : '0%', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              ].map(s => (
                <div key={s.label} className={`text-center p-3 ${s.bg} rounded-xl`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're on a break</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Relax and recharge. Toggle the switch to resume.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-400 font-mono font-medium">{fmt(breakSec)}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
