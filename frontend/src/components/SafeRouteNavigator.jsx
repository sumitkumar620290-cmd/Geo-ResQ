import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, AlertTriangle, CheckCircle, Clock, MapPin, ChevronRight, RefreshCw } from 'lucide-react';
import GisRiskMap from './GisRiskMap';

const riskColor = (crit) => {
  if (crit === 'CRITICAL') return 'var(--risk-critical)';
  if (crit === 'HIGH')     return 'var(--risk-high)';
  if (crit === 'MODERATE') return 'var(--risk-moderate)';
  return 'var(--risk-low)';
};

export default function SafeRouteNavigator({ gisData = {}, landslides = {} }) {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/routing/options');
      const data = await res.json();
      setRoutes(data.routes || []);
      if (data.routes?.length > 0) setSelectedRoute(data.routes[0]);
    } catch (e) {
      setError('Could not load routing data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const selectRoute = async (route) => {
    setSelectedRoute(route);
    try {
      const res = await fetch(`/api/routing/evaluate/${route.key}`);
      const data = await res.json();
      setSelectedRoute({ ...route, ...data });
    } catch (e) {
      // ignore evaluation error, still show basic info
    }
  };

  const { villages = [], roads = [], infrastructure = [] } = gisData;
  const lsFeatures = landslides?.features || [];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: 'var(--bg-void)', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Navigation size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>Safe Routes</span>
          </div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            Route Risk Analysis
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Compare road corridors by landslide risk exposure.
          </div>
        </div>

        {/* Load routes */}
        <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle)' }}>
          <button onClick={loadRoutes} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading...</> : <><Navigation size={13} /> Load Routes</>}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 14 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--risk-critical)' }}>
              {error}
            </div>
          </div>
        )}

        {/* Route List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!routes && !loading && !error && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              <Navigation size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Click "Load Routes" to compare road corridors</div>
            </div>
          )}
          {routes?.map((route, i) => {
            const isSelected = selectedRoute?.key === route.key;
            const rc = riskColor(route.risk_level || route.criticality);
            return (
              <motion.button
                key={route.key || i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectRoute(route)}
                style={{
                  textAlign: 'left', width: '100%', cursor: 'pointer',
                  padding: '12px 14px',
                  background: isSelected ? 'rgba(0,212,255,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isSelected ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{route.name || route.key}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-xs)', background: `${rc}18`, color: rc, border: `1px solid ${rc}40`, textTransform: 'uppercase' }}>
                    {route.risk_level || route.criticality || 'N/A'}
                  </span>
                </div>
                {route.length_km && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{route.length_km} km</div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected route detail */}
        {selectedRoute && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>
              Route Details
            </div>
            {[
              { label: 'Length',      val: selectedRoute.length_km ? `${selectedRoute.length_km} km` : '—' },
              { label: 'Type',        val: selectedRoute.type || '—' },
              { label: 'Risk Level',  val: selectedRoute.risk_level || selectedRoute.criticality || '—' },
              { label: 'Landslides',  val: selectedRoute.landslide_crossings != null ? selectedRoute.landslide_crossings : '—' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            {selectedRoute.recommendation && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--risk-low)' }}>
                {selectedRoute.recommendation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GisRiskMap
          gridPoints={[]}
          villages={villages}
          roads={roads}
          infrastructure={infrastructure}
          landslides={lsFeatures}
          customRoute={selectedRoute?.comparison || null}
          onSelectPoint={() => {}}
        />
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(9,14,26,0.95)', border: '1px solid var(--border-medium)', borderRadius: 999, padding: '7px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
          Road corridors shown. Risk indicated by color (red = critical, blue = safe).
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
