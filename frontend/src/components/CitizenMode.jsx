import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, AlertTriangle, Shield, ChevronRight,
  Phone, ArrowRight, RefreshCw, Navigation, Users,
  CheckCircle, XCircle, Info, Radio
} from 'lucide-react';

const riskColor = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'var(--risk-critical)';
  if (l === 'HIGH')     return 'var(--risk-high)';
  if (l === 'MODERATE') return 'var(--risk-moderate)';
  return 'var(--risk-low)';
};

const riskGradient = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'rgba(239,68,68,0.12)';
  if (l === 'HIGH')     return 'rgba(249,115,22,0.10)';
  if (l === 'MODERATE') return 'rgba(245,158,11,0.10)';
  return 'rgba(16,185,129,0.08)';
};

const riskIcon = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return '🔴';
  if (l === 'HIGH')     return '🟠';
  if (l === 'MODERATE') return '🟡';
  return '🟢';
};

const GUIDANCE = {
  CRITICAL: [
    'Move away from hillsides and slopes immediately',
    'Avoid all hill roads — risk of blockage or collapse',
    'Follow district authority evacuation instructions',
    'Keep emergency documents and essentials ready',
    'Call 112 if in immediate danger',
  ],
  HIGH: [
    'Avoid travel on hill roads unless essential',
    'Stay alert for unusual sounds from slopes (cracks, rumbles)',
    'Monitor official radio broadcasts for updates',
    'Have an emergency bag ready to leave quickly',
  ],
  MODERATE: [
    'Avoid unnecessary travel during heavy rainfall',
    'Watch for signs of soil movement near slopes',
    'Keep informed via local authorities',
  ],
  LOW: [
    'Normal conditions. Stay aware of weather forecasts.',
    'Report any unusual ground movement to authorities.',
  ],
};

function VillageCard({ village, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '12px 16px',
        background: selected ? 'rgba(0,212,255,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${selected ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: 2 }}>
            {village.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {village.district} · {village.population?.toLocaleString()} people
          </div>
        </div>
        <ChevronRight size={16} style={{ color: selected ? 'var(--accent)' : 'var(--text-tertiary)' }} />
      </div>
    </motion.button>
  );
}

export default function CitizenMode({ villages = [], onSelectVillage }) {
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('select'); // 'select' | 'detail'

  const handleVillageSelect = async (village) => {
    setSelectedVillage(village);
    setView('detail');
    setLoading(true);
    setError(null);
    try {
      const [riskRes, decRes] = await Promise.all([
        fetch('/api/risk/point', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: village.lat, longitude: village.lon }),
        }),
        fetch('/api/decisions/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: village.lat, longitude: village.lon, risk_score: 50, risk_level: 'MODERATE' }),
        }),
      ]);
      const risk = await riskRes.json();
      const dec = await decRes.json();
      setRiskData({ risk, dec });
    } catch (e) {
      setError('Could not load risk data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const level = riskData?.risk?.risk_level || 'LOW';
  const score = riskData?.risk?.risk_score ?? null;
  const guidance = GUIDANCE[level] || GUIDANCE.LOW;
  const rc = riskColor(level);

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── Header Banner ── */}
      <div style={{ width: '100%', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>Citizen Safety View</span>
          </div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Check Your Area Risk
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            Select your village to see the current landslide risk level and safety guidance.
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 600, padding: '20px 16px', flex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── Village Selection ── */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Select Your Village
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {villages.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <MapPin size={24} style={{ margin: '0 auto 8px', color: 'var(--text-tertiary)' }} />
                      <div>No villages loaded. Make sure the backend is running.</div>
                    </div>
                  ) : (
                    villages.map((v, i) => (
                      <VillageCard
                        key={v.name + i}
                        village={v}
                        selected={selectedVillage?.name === v.name}
                        onClick={() => handleVillageSelect(v)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Emergency contacts */}
              <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Emergency Contacts
                </div>
                {[
                  { label: 'National Emergency', num: '112' },
                  { label: 'Disaster Management (AP)', num: '0360-2214234' },
                  { label: 'Relief Commissioner', num: '1070' },
                ].map(({ label, num }) => (
                  <div key={num} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
                    <a href={`tel:${num}`} style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>{num}</a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Risk Detail ── */}
          {view === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Back button */}
              <button
                onClick={() => setView('select')}
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: 16 }}
              >
                ← Back to Village List
              </button>

              {/* Village name */}
              {selectedVillage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MapPin size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedVillage.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {selectedVillage.district} · Elevation {selectedVillage.elevation_m} m
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div style={{ padding: 32, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--bg-base)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Analyzing risk for {selectedVillage?.name}...</div>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div style={{ padding: 20, background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                  <XCircle size={24} style={{ color: 'var(--risk-critical)', marginBottom: 8 }} />
                  <div style={{ color: 'var(--risk-critical)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</div>
                  <button onClick={() => selectedVillage && handleVillageSelect(selectedVillage)} className="btn btn-ghost btn-sm">
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              )}

              {/* Risk Card */}
              {riskData && !loading && !error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {/* Big risk card */}
                  <div style={{
                    padding: '20px 20px',
                    borderRadius: 'var(--radius-xl)',
                    background: riskGradient(level),
                    border: `1px solid ${rc}44`,
                    boxShadow: `0 0 30px ${rc}22`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.06 }}>
                      ⚠️
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Current Risk Level</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: rc }}>{level}</div>
                          {(level === 'CRITICAL' || level === 'HIGH') && (
                            <span className="dot-pulse dot-pulse-anim" style={{ background: rc, width: 10, height: 10 }} />
                          )}
                        </div>
                      </div>
                      {score !== null && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, color: rc, lineHeight: 1 }}>{score}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Risk Score / 100</div>
                        </div>
                      )}
                    </div>

                    {/* Score bar */}
                    {score !== null && (
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8 }}
                          style={{ height: '100%', background: rc, borderRadius: 3 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* What to do */}
                  <div style={{ padding: '16px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
                      What You Should Do
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {guidance.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ color: rc, fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terrain info */}
                  {riskData.risk && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Elevation', val: riskData.risk.elevation_m ? `${riskData.risk.elevation_m} m` : '—' },
                        { label: 'Slope', val: riskData.risk.slope_deg ? `${riskData.risk.slope_deg}°` : '—' },
                        { label: '3-Day Rain', val: riskData.risk.rainfall_3d_mm ? `${riskData.risk.rainfall_3d_mm} mm` : '—' },
                        { label: 'Safe Shelter', val: selectedVillage?.safe_shelter || '—' },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Emergency contacts */}
                  <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Phone size={14} style={{ color: 'var(--risk-critical)' }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--risk-critical)', textTransform: 'uppercase' }}>Emergency</span>
                    </div>
                    <a href="tel:112" className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
                      📞 Call 112 — National Emergency
                    </a>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
                    Risk data is based on AI model trained on GSI, IMD, and NASA SRTM data for Arunachal Pradesh.
                    Always follow official authority guidance.
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
