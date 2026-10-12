import React from 'react';
import { X, Database, ShieldAlert, CheckCircle2, Clock, Zap } from 'lucide-react';

interface DatasetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatasetInfoModal: React.FC<DatasetInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="modal-title">Dataset Architecture & Provenance</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="notice-box" style={{ borderColor: '#fed7aa', backgroundColor: '#fffbeb', color: '#9a3412' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" style={{ marginTop: '0.15rem' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Synthetic Benchmark Disclosure</strong>
                This application operates on a 1,000,000-record historical synthetic smart grid dataset calibrated to Tamil Nadu regional load profiles (2015–2024). It is designed for operational analysis and load benchmarking. It does <em>not</em> represent real-time physical substation SCADA telemetry.
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              Core Data Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div className="card-box" style={{ padding: '0.85rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Monitored Energy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>14.74 GWh</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>14,737,800.74 kWh cumulative</div>
              </div>
              <div className="card-box" style={{ padding: '0.85rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Average Meter Consumption</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>14.74 kWh</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mean per meter-hour (std ±11.23)</div>
              </div>
              <div className="card-box" style={{ padding: '0.85rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Sample Scope</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>1,000,000</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hourly meter readings</div>
              </div>
              <div className="card-box" style={{ padding: '0.85rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Temporal Window</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>2015 – 2024</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>10 observation years (2024 partial)</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              Consumer Sectors & Operational Definitions
            </h3>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', lineHeight: 1.6, color: 'var(--text-body)' }}>
              <li><strong>Industrial (25.50 kWh mean):</strong> Continuous high-demand manufacturing, accounting for 25.96% of total grid energy.</li>
              <li><strong>Commercial (12.42 kWh mean):</strong> Daytime commercial complexes and business loads (12.65% share).</li>
              <li><strong>Agriculture (9.82 kWh mean):</strong> Irrigation pumps and farming feeders (10.00% share).</li>
              <li><strong>Domestic (4.95 kWh mean):</strong> Residential dwellings with morning and evening cooking/cooling peaks (5.04% share).</li>
              <li><strong>Miscellaneous (7.51 kWh mean):</strong> Public lighting, municipal services, and unclassified connections (46.35% share).</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
              Peak Demand Scheduling
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="pill-badge pill-badge-amber">
                <Clock className="w-3.5 h-3.5" /> Morning Peak: 06:00 – 09:00
              </div>
              <div className="pill-badge pill-badge-amber">
                <Clock className="w-3.5 h-3.5" /> Evening Peak: 18:00 – 22:00
              </div>
              <div className="pill-badge pill-badge-emerald">
                <Zap className="w-3.5 h-3.5" /> Peak Mean: 15.99 kWh vs Non-Peak: 13.85 kWh (1.155× Multiplier)
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn-primary">
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
