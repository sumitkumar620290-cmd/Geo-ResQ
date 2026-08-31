import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Users, Radio, Plus, ChevronRight,
  X, RefreshCw, CheckCircle, Clock, Phone,
  MessageSquare, Send, Filter, Search, Info
} from 'lucide-react';

const STATUS_CONFIG = {
  SIMULATED:     { label: 'SIMULATED',      cls: 'status-simulated' },
  NOT_CONFIGURED:{ label: 'NOT CONFIGURED', cls: 'status-not-configured' },
  QUEUED:        { label: 'QUEUED',         cls: 'status-queued' },
  SENT:          { label: 'SENT',           cls: 'status-sent' },
  FAILED:        { label: 'FAILED',         cls: 'status-failed' },
};

const LANGUAGES = ['Hindi', 'English', 'Bengali', 'Assamese', 'Nyishi', 'Adi', 'Galo'];
const CHANNELS  = ['SMS', 'WhatsApp', 'Email'];
const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

/* ── Alert Status Badge ── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SIMULATED;
  return <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>;
}

/* ── Empty State ── */
function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
      <Icon size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '0.8125rem' }}>{sub}</div>
    </div>
  );
}

/* ── Register Subscriber Form ── */
function RegisterForm({ onRegister, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '+91 ', village: '', language: 'Hindi', channel: 'SMS' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.phone.length < 8) { setError('Enter a valid phone number.'); return; }
    if (!form.village.trim()) { setError('Village is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await onRegister(form);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1400);
    } catch (e) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
    transition: 'border-color var(--transition-fast)',
    fontFamily: 'Inter',
  };

  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' };

  return (
    <div style={{ padding: '0 0 16px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 20px' }}>
        {/* Name */}
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Rahul Sharma" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+91 98765 43210" style={inputStyle} type="tel"
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
          />
        </div>

        {/* Village */}
        <div>
          <label style={labelStyle}>Village / Location</label>
          <input
            value={form.village} onChange={e => set('village', e.target.value)}
            placeholder="e.g. Dambuk, Arunachal Pradesh" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
          />
        </div>

        {/* Language + Channel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Language</label>
            <select
              value={form.language} onChange={e => set('language', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
            >
              {LANGUAGES.map(l => <option key={l} value={l} style={{ background: 'var(--bg-elevated)' }}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Alert Channel</label>
            <select
              value={form.channel} onChange={e => set('channel', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
            >
              {CHANNELS.map(c => <option key={c} value={c} style={{ background: 'var(--bg-elevated)' }}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--risk-critical)', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="btn btn-primary"
          style={{ justifyContent: 'center' }}
        >
          {success ? (
            <><CheckCircle size={14} /> Registered!</>
          ) : loading ? (
            <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Registering...</>
          ) : (
            <><Users size={14} /> Register for Alerts</>
          )}
        </button>

        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Registration is for testing only. No real alerts will be sent without production credentials.
        </div>
      </form>
    </div>
  );
}

/* ── Dispatch Form ── */
function DispatchForm({ onDispatch, onClose }) {
  const [form, setForm] = useState({ location: 'Dambuk', risk_score: 87, risk_level: 'CRITICAL', safe_shelter: 'Dambuk Higher Secondary School' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onDispatch(form);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1400);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter',
    transition: 'border-color var(--transition-fast)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Location</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Risk Score (0-100)</label>
          <input type="number" min={0} max={100} value={form.risk_score} onChange={e => set('risk_score', parseInt(e.target.value))} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Risk Level</label>
          <select value={form.risk_level} onChange={e => set('risk_level', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}>
            {RISK_LEVELS.map(l => <option key={l} value={l} style={{ background: 'var(--bg-elevated)' }}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Safe Shelter</label>
          <input value={form.safe_shelter} onChange={e => set('safe_shelter', e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
        </div>
      </div>
      <button type="submit" disabled={loading || success} className="btn btn-danger" style={{ justifyContent: 'center' }}>
        {success ? <><CheckCircle size={14} /> Dispatched!</> : loading ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending...</> : <><Send size={14} /> Dispatch Alert</>}
      </button>
    </form>
  );
}

/* ── MAIN ALERT CENTER ── */
export default function AlertCenter({ subscribers = [], dispatchHistory = [], onRegisterSubscriber, onDispatchCustomAlert }) {
  const [activeSection, setActiveSection] = useState('history');
  const [showRegister, setShowRegister] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);

  const tabs = [
    { id: 'history',  label: 'Alert History', count: dispatchHistory.length },
    { id: 'subscribers', label: 'Subscribers', count: subscribers.length },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg-void)' }}>

      {/* Page Header */}
      <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Bell size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>Alert Center</span>
              </div>
              <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Notification Management
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Register subscribers and simulate alert dispatch for monitored zones.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowDispatch(true); setShowRegister(false); }} className="btn btn-danger btn-sm">
                <Send size={13} /> Dispatch Alert
              </button>
              <button onClick={() => { setShowRegister(true); setShowDispatch(false); }} className="btn btn-primary btn-sm">
                <Plus size={13} /> Register Subscriber
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px' }}>

        {/* ── Inline Forms ── */}
        <AnimatePresence>
          {(showRegister || showDispatch) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 20 }}
            >
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {showRegister ? 'Register New Subscriber' : 'Dispatch Custom Alert'}
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setShowRegister(false); setShowDispatch(false); }}>
                    <X size={14} />
                  </button>
                </div>
                {showRegister && <RegisterForm onRegister={onRegisterSubscriber} onClose={() => setShowRegister(false)} />}
                {showDispatch && <DispatchForm onDispatch={onDispatchCustomAlert} onClose={() => setShowDispatch(false)} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                padding: '8px 14px', background: 'transparent', border: 'none',
                borderBottom: activeSection === id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeSection === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '0.875rem', fontWeight: activeSection === id ? 600 : 400,
                cursor: 'pointer', transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: '-1px',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{ padding: '1px 7px', background: 'var(--bg-elevated)', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 700, color: activeSection === id ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Alert History Table ── */}
        {activeSection === 'history' && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {dispatchHistory.length === 0 ? (
              <EmptyState icon={Bell} title="No alerts dispatched yet" sub='Use "Dispatch Alert" to simulate sending a notification.' />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Recipient', 'Location', 'Risk', 'Channel', 'Language', 'Status', 'Time'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-tertiary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchHistory.map((entry, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{entry.recipient || entry.name || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{entry.location || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {entry.risk_score != null && (
                            <span style={{ fontWeight: 700, color: entry.risk_score > 75 ? 'var(--risk-critical)' : entry.risk_score > 50 ? 'var(--risk-high)' : entry.risk_score > 25 ? 'var(--risk-moderate)' : 'var(--risk-low)' }}>
                              {entry.risk_score}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{entry.channel || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{entry.language || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><StatusBadge status={entry.status || 'SIMULATED'} /></td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Subscribers Table ── */}
        {activeSection === 'subscribers' && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {subscribers.length === 0 ? (
              <EmptyState icon={Users} title="No subscribers registered" sub='Use "Register Subscriber" to add people to the alert network.' />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Name', 'Phone', 'Village', 'Language', 'Channel'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{sub.name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{sub.phone}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{sub.village}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{sub.language}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem', fontWeight: 600, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                            {sub.channel}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info note */}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={13} style={{ color: 'var(--text-tertiary)', marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Status <strong style={{ color: 'var(--text-secondary)' }}>SIMULATED</strong> = notification simulated without real delivery.
            Status <strong style={{ color: 'var(--risk-moderate)' }}>NOT CONFIGURED</strong> = channel requires production API credentials (Twilio/MSG91).
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
