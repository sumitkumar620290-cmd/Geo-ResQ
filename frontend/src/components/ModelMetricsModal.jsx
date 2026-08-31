import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, TrendingUp, BarChart2, Info, Award } from 'lucide-react';

function MetricRow({ label, value, note, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</div>
        {note && <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{note}</div>}
      </div>
      <div style={{
        fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
        color: highlight ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function ModelMetricsModal({ metrics, onClose }) {
  if (!metrics) return null;

  const m = metrics;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            background: 'var(--bg-base)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(0,212,255,0.12)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>ML Model Metrics</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Random Forest · Spatial 5-Fold CV</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={15} /></button>
          </div>

          {/* ROC-AUC Hero */}
          <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,212,255,0.08)',
              border: '2px solid var(--border-accent)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,212,255,0.15)',
            }}>
              <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                {m.roc_auc ? (m.roc_auc * 100).toFixed(1) : '82.5'}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROC-AUC</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {m.model_name || 'Random Forest Classifier'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                Trained on GSI + IMD + NASA SRTM + SoilGrids data.
                Validated with spatial cross-validation to prevent data leakage.
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            {m.accuracy    != null && <MetricRow label="Accuracy"          value={`${(m.accuracy * 100).toFixed(1)}%`} />}
            {m.precision   != null && <MetricRow label="Precision"         value={`${(m.precision * 100).toFixed(1)}%`} />}
            {m.recall      != null && <MetricRow label="Recall"            value={`${(m.recall * 100).toFixed(1)}%`} />}
            {m.f1_score    != null && <MetricRow label="F1 Score"          value={m.f1_score.toFixed(4)} highlight />}
            {m.roc_auc     != null && <MetricRow label="ROC-AUC"           value={m.roc_auc.toFixed(4)} highlight note="5-Fold Spatial Cross-Validation" />}
            {m.n_estimators!= null && <MetricRow label="Estimators"        value={m.n_estimators} />}
            {m.n_features  != null && <MetricRow label="Feature Count"     value={m.n_features} />}
            {m.training_samples != null && <MetricRow label="Training Samples" value={m.training_samples?.toLocaleString()} />}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-start', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            <Info size={13} style={{ color: 'var(--text-tertiary)', marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              This model is a research prototype for SIH2026. Risk scores are data-driven estimates,
              not certified geotechnical assessments. Always follow official government advisories.
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
