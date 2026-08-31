import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Users, Milestone, School, Building2, ChevronLeft,
  ChevronRight, Info, AlertTriangle, Activity, ArrowUpRight,
  RefreshCw, MapPin, Thermometer, Cloud, Mountain, X, Shield,
  Maximize2, Navigation2, TrendingUp, Eye, EyeOff
} from 'lucide-react';
import GisRiskMap from './GisRiskMap';

/* ── Helpers ── */
const riskColor = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'var(--risk-critical)';
  if (l === 'HIGH')     return 'var(--risk-high)';
  if (l === 'MODERATE') return 'var(--risk-moderate)';
  return 'var(--risk-low)';
};

const riskBadgeClass = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'risk-badge risk-badge-critical';
  if (l === 'HIGH')     return 'risk-badge risk-badge-high';
  if (l === 'MODERATE') return 'risk-badge risk-badge-moderate';
  return 'risk-badge risk-badge-low';
};

const riskGlowClass = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') return 'risk-glow-critical';
  if (l === 'HIGH')     return 'risk-glow-high';
  if (l === 'MODERATE') return 'risk-glow-moderate';
  return 'risk-glow-low';
};

/* ── Stat Card (Left Sidebar) ── */
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={14} style={{ color: color || 'var(--text-secondary)', flexShrink: 0 }} />}
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'Outfit' }}>
          {value ?? '—'}
        </span>
        {sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── Layer Toggle Button ── */
function LayerToggle({ label, count, active, onToggle, color }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px', width: '100%', cursor: 'pointer',
        background: active ? `rgba(${color},0.08)` : 'transparent',
        border: 'none', borderBottom: '1px solid var(--border-subtle)',
        color: active ? `rgb(${color})` : 'var(--text-tertiary)',
        fontSize: '0.8125rem', fontWeight: 500, transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {active
          ? <Eye size={13} style={{ color: `rgb(${color})` }} />
          : <EyeOff size={13} />
        }
        {label}
      </div>
      {count != null && (
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Factor Bar (Right Panel) ── */
function FactorBar({ label, value, maxVal = 5 }) {
  const pct = Math.round((value / maxVal) * 100);
  const color = pct > 75 ? 'var(--risk-critical)' : pct > 50 ? 'var(--risk-high)' : pct > 25 ? 'var(--risk-moderate)' : 'var(--risk-low)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{pct > 75 ? 'HIGH' : pct > 50 ? 'MOD' : pct > 25 ? 'LOW' : 'VLOW'}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

/* ── RIGHT PANEL — Zone Detail Drawer ── */
function ZoneDetailPanel({ data, location, onDispatchAlert, onClose }) {
  const [dispatching, setDispatching] = useState(false);

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <MapPin size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Click any point on the map to inspect its risk profile.</div>
      </div>
    );
  }

  const { risk, exposure, decisions } = data;
  const rc = riskColor(risk?.risk_level);
  const decList = decisions?.recommendations || [];

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const village = exposure?.exposed_villages?.[0]?.name;
      await onDispatchAlert({
        location: village || `${location?.lat?.toFixed(3)},${location?.lon?.toFixed(3)}`,
        risk_score: risk?.risk_score,
        risk_level: risk?.risk_level,
        safe_shelter: exposure?.exposed_villages?.[0]?.safe_shelter || 'Nearest Government School',
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: `linear-gradient(135deg, rgba(${rc === 'var(--risk-critical)' ? '239,68,68' : rc === 'var(--risk-high)' ? '249,115,22' : rc === 'var(--risk-moderate)' ? '245,158,11' : '16,185,129'},0.10) 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className={riskBadgeClass(risk?.risk_level)}>
            {risk?.risk_level || 'UNKNOWN'}
          </span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Close panel">
            <X size={14} />
          </button>
        </div>
        <div style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, color: rc, lineHeight: 1 }}>
          {risk?.risk_score ?? '—'}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>/100</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
          {location ? `${location.lat?.toFixed(4)}°N, ${location.lon?.toFixed(4)}°E` : ''}
        </div>
      </div>

      {/* Risk Contributing Factors */}
      {risk?.contributing_factors?.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>
            Contributing Factors
          </div>
          {risk.contributing_factors.map((f, i) => {
            const sevColor = f.severity === 'HIGH' ? 'var(--risk-high)' : f.severity === 'MODERATE' ? 'var(--risk-moderate)' : 'var(--risk-low)';
            return (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.factor}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: sevColor, background: `${sevColor}18`, padding: '1px 7px', borderRadius: 'var(--radius-xs)', border: `1px solid ${sevColor}40` }}>
                    {f.severity}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{f.description}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exposure */}
      {exposure && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>
            Exposed Elements
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { Icon: Users,     label: 'Population', val: exposure.total_exposed_population != null ? exposure.total_exposed_population.toLocaleString() : '—' },
              { Icon: Building2, label: 'Villages',   val: exposure.counts?.villages ?? '—' },
              { Icon: Milestone, label: 'Roads',      val: exposure.counts?.roads ?? '—' },
              { Icon: School,    label: 'Schools',    val: exposure.counts?.schools ?? '—' },
            ].map(({ Icon, label, val }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
                <Icon size={12} style={{ color: 'var(--text-tertiary)', marginBottom: 4 }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{val}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Exposed villages list with safe shelters */}
          {exposure.exposed_villages?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {exposure.exposed_villages.slice(0, 2).map((v, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  <span style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}>🛡 {v.safe_shelter}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Actions */}
      {decList.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>
            Recommended Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decList.slice(0, 3).map((rec, i) => (
              <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', borderLeft: `2px solid ${rc}` }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: rc, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {rec.category?.replace(/_/g, ' ')} · {rec.urgency}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{rec.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.action_text}</div>
                {rec.authority_target && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 4 }}>→ {rec.authority_target}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terrain & Conditions — using risk.features from the backend */}
      {risk?.features && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>
            Terrain &amp; Conditions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Elevation',      val: risk.features.elevation      != null ? `${Math.round(risk.features.elevation)} m`        : null },
              { label: 'Slope',          val: risk.features.slope          != null ? `${risk.features.slope.toFixed(1)}°`               : null },
              { label: '3-Day Rainfall', val: risk.features.rainfall_3_day != null ? `${Math.round(risk.features.rainfall_3_day)} mm`   : null },
              { label: '7-Day Rainfall', val: risk.features.rainfall_7_day != null ? `${Math.round(risk.features.rainfall_7_day)} mm`   : null },
              { label: 'Clay Content',   val: risk.features.clay           != null ? `${risk.features.clay.toFixed(1)}%`               : null },
            ].filter(r => r.val !== null).map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ padding: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleDispatch}
          disabled={dispatching}
          className="btn btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {dispatching
            ? <><RefreshCw size={14} className="animate-spin" /> Dispatching...</>
            : <><AlertTriangle size={14} /> Generate Alert</>
          }
        </button>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Alerts are simulated. No real notifications will be sent.
        </div>
      </div>
    </div>
  );
}

/* ── MAIN AUTHORITY DASHBOARD ── */
export default function AuthorityDashboard({
  gridPoints = [],
  gisData = {},
  landslides = {},
  selectedPointData,
  selectedLocation,
  onSelectPoint,
  onDispatchAlert,
  onSwitchToEmergency,
  loading = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [layers, setLayers] = useState({
    grid: true,
    villages: true,
    roads: true,
    infra: true,
    landslides: false,
  });

  // Open detail panel when a point is selected
  useEffect(() => {
    if (selectedPointData) setDetailOpen(true);
  }, [selectedPointData]);

  const { villages = [], roads = [], infrastructure = [] } = gisData;
  const lsFeatures = landslides?.features || [];

  // Summarize risk grid
  const riskSummary = {
    critical: gridPoints.filter(p => p.risk_score > 75).length,
    high:     gridPoints.filter(p => p.risk_score > 50 && p.risk_score <= 75).length,
    moderate: gridPoints.filter(p => p.risk_score > 25 && p.risk_score <= 50).length,
    low:      gridPoints.filter(p => p.risk_score <= 25).length,
    total:    gridPoints.length,
  };

  const maxRisk = gridPoints.length > 0 ? Math.max(...gridPoints.map(p => p.risk_score)) : null;
  const avgRisk = gridPoints.length > 0 ? Math.round(gridPoints.reduce((s, p) => s + p.risk_score, 0) / gridPoints.length) : null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: 'var(--bg-void)', overflow: 'hidden', position: 'relative' }}>

      {/* ════════════════════════════════════════
          LEFT SIDEBAR
      ════════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              flexShrink: 0, overflow: 'hidden',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-base)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ width: 240, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Region Header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>
                  Pilot Region
                </div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Arunachal Pradesh
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Siang &amp; Dibang River Corridors
                </div>
              </div>

              {/* Risk Overview */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '10px 14px 6px', fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Risk Overview
                </div>

                {loading ? (
                  <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[80, 60, 70, 50].map((w, i) => <div key={i} className="skeleton" style={{ height: 28, width: `${w}%` }} />)}
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'Critical', count: riskSummary.critical, color: 'var(--risk-critical)', bar: 'rgb(239,68,68)' },
                      { label: 'High',     count: riskSummary.high,     color: 'var(--risk-high)',     bar: 'rgb(249,115,22)' },
                      { label: 'Moderate', count: riskSummary.moderate, color: 'var(--risk-moderate)', bar: 'rgb(245,158,11)' },
                      { label: 'Low',      count: riskSummary.low,      color: 'var(--risk-low)',      bar: 'rgb(16,185,129)' },
                    ].map(({ label, count, color, bar }) => (
                      <div key={label} style={{ padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color, fontFamily: 'Outfit' }}>{count}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Stats */}
              <StatCard label="Peak Risk Score" value={maxRisk} sub="/100" color={maxRisk > 75 ? 'var(--risk-critical)' : maxRisk > 50 ? 'var(--risk-high)' : 'var(--risk-moderate)'} />
              <StatCard label="Avg. Risk Score" value={avgRisk} sub="/100" />
              <StatCard label="Villages" value={villages.length} icon={Building2} />
              <StatCard label="GSI Events" value={lsFeatures.length} icon={AlertTriangle} color="var(--risk-moderate)" />

              {/* Layers */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ padding: '10px 14px 6px', fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, borderTop: '1px solid var(--border-subtle)' }}>
                  Map Layers
                </div>
                <LayerToggle label="Risk Grid" count={gridPoints.length} active={layers.grid} color="0,212,255" onToggle={() => setLayers(l => ({ ...l, grid: !l.grid }))} />
                <LayerToggle label="Villages" count={villages.length} active={layers.villages} color="16,185,129" onToggle={() => setLayers(l => ({ ...l, villages: !l.villages }))} />
                <LayerToggle label="Road Corridors" count={roads.length} active={layers.roads} color="245,158,11" onToggle={() => setLayers(l => ({ ...l, roads: !l.roads }))} />
                <LayerToggle label="Infrastructure" count={infrastructure.length} active={layers.infra} color="139,92,246" onToggle={() => setLayers(l => ({ ...l, infra: !l.infra }))} />
                <LayerToggle label="GSI Landslides" count={lsFeatures.length} active={layers.landslides} color="236,72,153" onToggle={() => setLayers(l => ({ ...l, landslides: !l.landslides }))} />
              </div>

              {/* Emergency Button */}
              <div style={{ padding: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={onSwitchToEmergency}
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <AlertTriangle size={14} />
                  Activate Emergency
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'absolute', left: sidebarOpen ? 240 : 0,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 100, width: 20, height: 48,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderLeft: sidebarOpen ? '1px solid var(--border-medium)' : '1px solid var(--border-medium)',
          borderRadius: sidebarOpen ? '0 var(--radius-sm) var(--radius-sm) 0' : 'var(--radius-sm) 0 0 var(--radius-sm)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)', transition: 'left 0.3s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* ════════════════════════════════════════
          CENTER — MAP (HERO)
      ════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'var(--bg-void)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--bg-elevated)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Loading risk intelligence...</div>
          </div>
        )}

        <GisRiskMap
          gridPoints={layers.grid ? gridPoints : []}
          villages={layers.villages ? villages : []}
          roads={layers.roads ? roads : []}
          infrastructure={layers.infra ? infrastructure : []}
          landslides={layers.landslides ? lsFeatures : []}
          selectedPoint={selectedLocation}
          onSelectPoint={onSelectPoint}
        />

        {/* Instruction pill */}
        {!selectedPointData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, pointerEvents: 'none',
              background: 'rgba(9,14,26,0.95)',
              border: '1px solid var(--border-medium)',
              borderRadius: 999, padding: '8px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <MapPin size={13} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Click anywhere on the map to evaluate risk</span>
          </motion.div>
        )}
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Zone Detail
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {detailOpen && (
          <motion.aside
            key="detail"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            style={{
              width: 300, flexShrink: 0,
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-base)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                Zone Intelligence
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetailOpen(false)} title="Close">
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ZoneDetailPanel
                data={selectedPointData}
                location={selectedLocation}
                onDispatchAlert={onDispatchAlert}
                onClose={() => setDetailOpen(false)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CSS spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
