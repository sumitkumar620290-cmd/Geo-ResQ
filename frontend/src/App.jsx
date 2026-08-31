import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthorityDashboard from './components/AuthorityDashboard';
import CitizenMode from './components/CitizenMode';
import EmergencyMode from './components/EmergencyMode';
import AlertCenter from './components/AlertCenter';
import SafeRouteNavigator from './components/SafeRouteNavigator';
import CitizenReportsPortal from './components/CitizenReportsPortal';
import ModelMetricsModal from './components/ModelMetricsModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Data States
  const [gridPoints, setGridPoints]     = useState([]);
  const [gisData, setGisData]           = useState({ villages: [], roads: [], infrastructure: [], summary: {} });
  const [landslides, setLandslides]     = useState({ features: [] });
  const [metrics, setMetrics]           = useState(null);
  const [subscribers, setSubscribers]   = useState([]);
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [reports, setReports]           = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Inspector
  const [selectedLocation, setSelectedLocation] = useState({ lat: 28.1633, lon: 95.4598 });
  const [selectedPointData, setSelectedPointData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setLoadError(false);
    try {
      // Health check first
      const healthRes = await fetch('/api/health');
      const healthJson = await healthRes.json();
      setSystemHealth(healthJson);

      // GIS Layers
      const gisRes = await fetch('/api/gis/layers');
      const gisJson = await gisRes.json();
      setGisData(gisJson);

      // Risk Grid (lower resolution for faster loading)
      const gridRes = await fetch('/api/risk/grid?res=25');
      const gridJson = await gridRes.json();
      setGridPoints(gridJson.grid_points || []);

      // GSI Landslides
      const lsRes = await fetch('/api/gis/landslides');
      const lsJson = await lsRes.json();
      setLandslides(lsJson || { features: [] });

      // Metrics
      const metRes = await fetch('/api/metrics');
      const metJson = await metRes.json();
      setMetrics(metJson);

      // Subscribers
      const subRes = await fetch('/api/alerts/subscribers');
      const subJson = await subRes.json();
      setSubscribers(subJson.subscribers || []);

      // Dispatch history
      const histRes = await fetch('/api/alerts/history');
      const histJson = await histRes.json();
      setDispatchHistory(histJson.history || []);

      // Reports
      const repRes = await fetch('/api/reports');
      const repJson = await repRes.json();
      setReports(repJson.reports || []);

      // Initial default point evaluation
      await evaluateLocation(28.1633, 95.4598);
    } catch (err) {
      console.error('[GEORESQ] Data load error:', err);
      setLoadError(true);
      setSystemHealth({ status: 'DEGRADED' });
    } finally {
      setLoading(false);
    }
  }

  const evaluateLocation = async (lat, lon) => {
    setSelectedLocation({ lat, lon });
    try {
      // Point risk
      const riskRes = await fetch('/api/risk/point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      const riskJson = await riskRes.json();

      // Decisions + exposure
      const decRes = await fetch('/api/decisions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          risk_score: riskJson.risk_score ?? 50,
          risk_level: riskJson.risk_level ?? 'MODERATE',
        }),
      });
      const decJson = await decRes.json();

      setSelectedPointData({
        risk: riskJson,
        exposure: decJson.exposure,
        decisions: decJson.decisions,
      });
    } catch (err) {
      console.error('[GEORESQ] Evaluation error:', err);
    }
  };

  const handleDispatchAlert = async (payload) => {
    try {
      await fetch('/api/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Refresh history
      const histRes = await fetch('/api/alerts/history');
      const histJson = await histRes.json();
      setDispatchHistory(histJson.history || []);
    } catch (err) {
      console.error('[GEORESQ] Dispatch error:', err);
    }
  };

  const handleRegisterSubscriber = async (payload) => {
    try {
      await fetch('/api/alerts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const subRes = await fetch('/api/alerts/subscribers');
      const subJson = await subRes.json();
      setSubscribers(subJson.subscribers || []);
    } catch (err) {
      console.error('[GEORESQ] Register error:', err);
    }
  };

  const handleSubmitReport = async (payload) => {
    try {
      await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const repRes = await fetch('/api/reports');
      const repJson = await repRes.json();
      setReports(repJson.reports || []);
    } catch (err) {
      console.error('[GEORESQ] Report submit error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Navbar ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        emergencyMode={emergencyMode}
        setEmergencyMode={setEmergencyMode}
        onOpenMetrics={() => setShowMetricsModal(true)}
        systemHealth={systemHealth}
      />

      {/* ── Backend Error Banner ── */}
      {loadError && (
        <div style={{
          background: 'rgba(245,158,11,0.10)',
          borderBottom: '1px solid rgba(245,158,11,0.3)',
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          fontSize: '0.8125rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--risk-moderate)' }}>⚠</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Could not reach the GEORESQ backend at <code style={{ color: 'var(--risk-moderate)' }}>127.0.0.1:8000</code>.
              Ensure the FastAPI server is running.
            </span>
          </div>
          <button
            onClick={loadInitialData}
            style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Main View Router ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AuthorityDashboard
                gridPoints={gridPoints}
                gisData={gisData}
                landslides={landslides}
                selectedPointData={selectedPointData}
                selectedLocation={selectedLocation}
                onSelectPoint={evaluateLocation}
                onDispatchAlert={handleDispatchAlert}
                onSwitchToEmergency={() => { setEmergencyMode(true); setActiveTab('emergency'); }}
                loading={loading}
              />
            </motion.div>
          )}

          {activeTab === 'citizen' && (
            <motion.div key="citizen" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CitizenMode
                villages={gisData?.villages || []}
                onSelectVillage={(v) => evaluateLocation(v.lat, v.lon)}
              />
            </motion.div>
          )}

          {activeTab === 'emergency' && (
            <motion.div key="emergency" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <EmergencyMode
                onDispatchAlert={handleDispatchAlert}
                onExitEmergency={() => { setEmergencyMode(false); setActiveTab('dashboard'); }}
              />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div key="alerts" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AlertCenter
                subscribers={subscribers}
                dispatchHistory={dispatchHistory}
                onRegisterSubscriber={handleRegisterSubscriber}
                onDispatchCustomAlert={handleDispatchAlert}
              />
            </motion.div>
          )}

          {activeTab === 'routing' && (
            <motion.div key="routing" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SafeRouteNavigator
                gisData={gisData}
                landslides={landslides}
              />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" style={{ flex: 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CitizenReportsPortal
                reports={reports}
                onSubmitReport={handleSubmitReport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── ML Metrics Modal ── */}
      {showMetricsModal && (
        <ModelMetricsModal
          metrics={metrics}
          onClose={() => setShowMetricsModal(false)}
        />
      )}
    </div>
  );
}
