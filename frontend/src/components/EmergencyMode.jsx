import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Users, MapPin, Radio, RefreshCw,
  ChevronRight, Zap, Shield, Clock, Phone,
  CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';

const CRITICAL_ZONES = [
  { name: 'Dambuk Valley',   lat: 28.1633, lon: 95.4598, risk: 87, population: 1240, village: 'Dambuk' },
  { name: 'Mayudia Corridor',lat: 28.2817, lon: 95.7631, risk: 79, population: 890,  village: 'Mayudia' },
  { name: 'Aohali Ridge',    lat: 28.3120, lon: 95.6200, risk: 76, population: 650,  village: 'Aohali' },
];

const riskColor = (score) => {
  if (score > 75) return 'var(--risk-critical)';
  if (score > 50) return 'var(--risk-high)';
  if (score > 25) return 'var(--risk-moderate)';
  return 'var(--risk-low)';
};

const riskLevel = (score) => {
  if (score > 75) return 'CRITICAL';
  if (score > 50) return 'HIGH';
  if (score > 25) return 'MODERATE';
  return 'LOW';
};

export default function EmergencyMode({ onDispatchAlert, onExitEmergency }) {
  const [dispatchLog, setDispatchLog] = useState([]);
  const [dispatching, setDispatching] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDispatch = async (zone) => {
    setDispatching(zone.name);
    try {
      await onDispatchAlert({
        location: zone.village,
        risk_score: zone.risk,
        risk_level: riskLevel(zone.risk),
        safe_shelter: 'Nearest Government School',
      });
      setDispatchLog(prev => [{
        zone: zone.name,
        time: new Date().toLocaleTimeString(),
        status: 'DISPATCHED',
      }, ...prev]);
    } catch (e) {
      setDispatchLog(prev => [{
        zone: zone.name,
        time: new Date().toLocaleTimeString(),
        status: 'FAILED',
      }, ...prev]);
    } finally {
      setDispatching(null);
    }
  };

  const handleDispatchAll = async () => {
    for (const zone of CRITICAL_ZONES) {
      await handleDispatch(zone);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const totalExposed = CRITICAL_ZONES.reduce((s, z) => s + z.population, 0);

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg-void)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Emergency Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(185,28,28,0.08) 100%)',
        borderBottom: '1px solid rgba(239,68,68,0.35)',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Pulsing icon */}
              <div
                className="animate-emergency-pulse"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.15)',
                  border: '2px solid rgba(239,68,68,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} style={{ color: 'var(--risk-critical)' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.375rem', fontWeight: 800, color: 'var(--risk-critical)', letterSpacing: '-0.01em' }}>
                  EMERGENCY MODE
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.7)', fontWeight: 500, marginTop: 2 }}>
                  {now.toLocaleTimeString()} · Arunachal Pradesh Pilot Region
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleDispatchAll} className="btn btn-danger">
                <Radio size={14} />
                Dispatch All Alerts
              </button>
              <button onClick={onExitEmergency} className="btn btn-ghost">
                <ArrowLeft size={14} />
                Exit Emergency
              </button>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Critical Zones', value: CRITICAL_ZONES.length, color: 'var(--risk-critical)' },
              { label: 'People at Risk', value: totalExposed.toLocaleString(), color: 'var(--risk-high)' },
              { label: 'Alerts Sent', value: dispatchLog.filter(d => d.status === 'DISPATCHED').length, color: 'var(--risk-moderate)' },
              { label: 'Status', value: 'ACTIVE', color: 'var(--risk-critical)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', minWidth: 110 }}>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.375rem', fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, padding: '20px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: 20 }}>

          {/* Critical zones list */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
              Priority Zones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CRITICAL_ZONES.map((zone, i) => {
                const rc = riskColor(zone.risk);
                const already = dispatchLog.some(d => d.zone === zone.name && d.status === 'DISPATCHED');
                return (
                  <motion.div
                    key={zone.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      padding: '16px 18px',
                      background: 'var(--bg-surface)',
                      border: `1px solid ${rc}44`,
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: `0 0 20px ${rc}11`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${rc}18`, border: `1px solid ${rc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.75rem', color: rc }}>{zone.risk}</span>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{zone.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {zone.lat.toFixed(4)}°N, {zone.lon.toFixed(4)}°E
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${rc}18`, color: rc, border: `1px solid ${rc}44` }}>
                          {riskLevel(zone.risk)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Exposed', val: `${zone.population.toLocaleString()} people` },
                        { label: 'Village', val: zone.village },
                        { label: 'Priority', val: `#${i + 1}` },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ textAlign: 'center', padding: '8px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleDispatch(zone)}
                        disabled={dispatching === zone.name || already}
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1, justifyContent: 'center', opacity: already ? 0.7 : 1 }}
                      >
                        {dispatching === zone.name ? (
                          <><RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Dispatching...</>
                        ) : already ? (
                          <><CheckCircle size={12} /> Alert Sent</>
                        ) : (
                          <><Radio size={12} /> Dispatch Alert</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Dispatch log */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
              Dispatch Log
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {dispatchLog.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <Radio size={24} style={{ color: 'var(--text-tertiary)', marginBottom: 10 }} />
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>No alerts dispatched yet.</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 4 }}>Use "Dispatch Alert" on a zone to begin.</div>
                </div>
              ) : (
                <AnimatePresence>
                  {dispatchLog.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: i < dispatchLog.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      {entry.status === 'DISPATCHED'
                        ? <CheckCircle size={14} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />
                        : <XCircle size={14} style={{ color: 'var(--risk-critical)', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.zone}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{entry.time}</div>
                      </div>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-xs)',
                        background: entry.status === 'DISPATCHED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: entry.status === 'DISPATCHED' ? 'var(--risk-low)' : 'var(--risk-critical)',
                        border: `1px solid ${entry.status === 'DISPATCHED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {entry.status}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Shield size={14} style={{ color: 'var(--risk-moderate)', marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  All alerts are <strong style={{ color: 'var(--risk-moderate)' }}>simulated</strong>. No real SMS/WhatsApp messages are sent. This system requires active Twilio/MSG91 credentials for production use.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
