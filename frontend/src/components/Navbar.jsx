import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Users, Zap, Bell, Navigation, FileText,
  Activity, ChevronDown, Wifi, AlertTriangle, X, Menu
} from 'lucide-react';

const TABS = [
  { id: 'dashboard',  label: 'Command',  Icon: Map,        short: 'Map' },
  { id: 'citizen',    label: 'Citizen',  Icon: Users,      short: 'Citizen' },
  { id: 'emergency',  label: 'Emergency',Icon: Zap,        short: 'Emergency', danger: true },
  { id: 'alerts',     label: 'Alerts',   Icon: Bell,       short: 'Alerts' },
  { id: 'routing',    label: 'Routes',   Icon: Navigation, short: 'Routes' },
  { id: 'reports',    label: 'Reports',  Icon: FileText,   short: 'Reports' },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  emergencyMode,
  setEmergencyMode,
  onOpenMetrics,
  systemHealth = null,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (id === 'emergency') setEmergencyMode(true);
    else if (emergencyMode) setEmergencyMode(false);
    setMobileOpen(false);
  };

  const healthOk = systemHealth?.status === 'HEALTHY';

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(5,8,15,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center h-14 px-4 gap-4">
          {/* ── Brand ── */}
          <div className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div
              style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #0088cc, #00d4ff)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(0,212,255,0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="leading-tight">
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                GEORESQ
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                From Warning to Action
              </div>
            </div>
          </div>

          {/* ── Emergency banner (when active) ── */}
          {emergencyMode && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              <span className="dot-pulse dot-pulse-anim" style={{ background: 'var(--risk-critical)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--risk-critical)', textTransform: 'uppercase' }}>
                Emergency Active
              </span>
            </motion.div>
          )}

          {/* ── Desktop Nav Tabs ── */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto">
            {TABS.map(({ id, label, Icon, danger }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: isActive
                      ? (danger ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.10)')
                      : 'transparent',
                    color: isActive
                      ? (danger ? 'var(--risk-critical)' : 'var(--accent)')
                      : (danger ? 'rgba(239,68,68,0.75)' : 'var(--text-secondary)'),
                    border: isActive
                      ? (danger ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(0,212,255,0.3)')
                      : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = danger ? 'var(--risk-critical)' : 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? 'rgba(239,68,68,0.75)' : 'var(--text-secondary)'; }}}
                >
                  <Icon size={14} />
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', bottom: -1, left: 6, right: 6, height: 2,
                        background: danger ? 'var(--risk-critical)' : 'var(--accent)',
                        borderRadius: 2,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* System Health */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span
                className="dot-pulse dot-pulse-anim"
                style={{ background: systemHealth ? (healthOk ? 'var(--risk-low)' : 'var(--risk-critical)') : 'var(--text-tertiary)' }}
              />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                {systemHealth ? (healthOk ? 'ONLINE' : 'DEGRADED') : 'CONNECTING'}
              </span>
            </div>

            {/* Metrics */}
            <button
              onClick={onOpenMetrics}
              className="btn btn-ghost btn-sm hidden sm:flex"
              title="Model Metrics"
            >
              <Activity size={13} />
              <span className="hidden lg:inline">ML Metrics</span>
            </button>

            {/* Emergency toggle */}
            {emergencyMode ? (
              <button
                onClick={() => { setEmergencyMode(false); setActiveTab('dashboard'); }}
                className="btn btn-danger btn-sm"
                title="Exit Emergency"
              >
                <X size={13} />
                <span>Exit Emergency</span>
              </button>
            ) : (
              <button
                onClick={() => handleTabClick('emergency')}
                className="btn btn-sm hidden sm:flex"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: 'var(--risk-critical)',
                  border: '1px solid rgba(239,68,68,0.35)',
                }}
                title="Simulate Emergency"
              >
                <Zap size={13} />
                <span className="hidden lg:inline">Emergency</span>
              </button>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)' }}
            >
              <div className="px-4 py-2 flex flex-col gap-1">
                {TABS.map(({ id, label, Icon, danger }) => (
                  <button
                    key={id}
                    onClick={() => handleTabClick(id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left w-full transition-all"
                    style={{
                      background: activeTab === id ? (danger ? 'rgba(239,68,68,0.12)' : 'rgba(0,212,255,0.08)') : 'transparent',
                      color: activeTab === id ? (danger ? 'var(--risk-critical)' : 'var(--accent)') : (danger ? 'rgba(239,68,68,0.8)' : 'var(--text-secondary)'),
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
                <div className="divider my-1" />
                <button onClick={() => { onOpenMetrics(); setMobileOpen(false); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left w-full" style={{ color: 'var(--text-secondary)' }}>
                  <Activity size={16} />
                  ML Model Metrics
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
