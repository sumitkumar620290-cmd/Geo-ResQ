import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, MapPin, Phone, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

const INDICATORS = [
  'Ground cracking', 'Soil movement', 'Unusual sounds from slope',
  'Road damage', 'Water logging', 'Tree movement',
  'Building cracks', 'Debris flow', 'Slope erosion',
];
const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
const SEVERITY_COLORS = { LOW: 'var(--risk-low)', MODERATE: 'var(--risk-moderate)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)' };

function ReportCard({ report, expanded, onToggle }) {
  const rc = SEVERITY_COLORS[report.severity] || 'var(--text-secondary)';
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${rc}18`, border: `1px solid ${rc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={14} style={{ color: rc }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: 2 }}>{report.citizen_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span>{report.village}</span>
              <span>·</span>
              <span style={{ color: rc, fontWeight: 600 }}>{report.severity}</span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Location', val: report.location_desc },
                { label: 'Phone', val: report.phone },
                { label: 'Coordinates', val: `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}` },
              ].map(({ label, val }) => val && (
                <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-tertiary)', minWidth: 90 }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
              {report.indicators?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>Indicators Reported</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {report.indicators.map(ind => (
                      <span key={ind} style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 500, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CitizenReportsPortal({ reports = [], onSubmitReport }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    citizen_name: '', phone: '+91 ', village: '', location_desc: '',
    latitude: 28.1633, longitude: 95.4598,
    indicators: [], severity: 'HIGH',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleIndicator = (ind) => setForm(f => ({
    ...f,
    indicators: f.indicators.includes(ind)
      ? f.indicators.filter(i => i !== ind)
      : [...f.indicators, ind],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitReport(form);
      setSubmitSuccess(true);
      setTimeout(() => { setSubmitSuccess(false); setShowForm(false); setForm({ citizen_name: '', phone: '+91 ', village: '', location_desc: '', latitude: 28.1633, longitude: 95.4598, indicators: [], severity: 'HIGH' }); }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter',
    transition: 'border-color var(--transition-fast)',
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg-void)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FileText size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>Field Reports</span>
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Citizen Ground Reports</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Community-reported landslide observations for official triage.
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
            <Plus size={13} /> Submit Report
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px' }}>

        {/* Submit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 20 }}
            >
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Submit Field Observation</div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Your Name</label>
                      <input required value={form.citizen_name} onChange={e => set('citizen_name', e.target.value)} placeholder="Full name" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Phone</label>
                      <input required value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Village</label>
                      <input required value={form.village} onChange={e => set('village', e.target.value)} placeholder="e.g. Dambuk" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Severity</label>
                      <select value={form.severity} onChange={e => set('severity', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}>
                        {SEVERITIES.map(s => <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Location Description</label>
                    <input value={form.location_desc} onChange={e => set('location_desc', e.target.value)} placeholder="Describe where the incident is occurring" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-medium)'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>What are you observing? (select all that apply)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {INDICATORS.map(ind => {
                        const selected = form.indicators.includes(ind);
                        return (
                          <button
                            key={ind} type="button"
                            onClick={() => toggleIndicator(ind)}
                            style={{
                              padding: '5px 12px', borderRadius: 99, fontSize: '0.8125rem', cursor: 'pointer',
                              background: selected ? 'rgba(0,212,255,0.12)' : 'var(--bg-elevated)',
                              border: `1px solid ${selected ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                              color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                              transition: 'all var(--transition-fast)',
                              fontWeight: selected ? 600 : 400,
                            }}
                          >
                            {ind}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button type="submit" disabled={submitting || submitSuccess} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    {submitSuccess ? <><CheckCircle size={14} /> Report Submitted!</> : submitting ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting...</> : <><FileText size={14} /> Submit Report</>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reports list */}
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
            {reports.length} Reports on Record
          </div>
          {reports.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
              <FileText size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No reports yet</div>
              <div style={{ fontSize: '0.8125rem' }}>Use "Submit Report" to file a ground observation.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map((rep, i) => (
                <ReportCard
                  key={i}
                  report={rep}
                  expanded={expandedId === i}
                  onToggle={() => setExpandedId(expandedId === i ? null : i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
