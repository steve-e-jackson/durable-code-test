/**
 * Purpose: Status panel component for displaying oscilloscope connection and data metrics
 * Scope: UI component for showing connection status, streaming state, and performance metrics
 * Overview: Provides real-time status information for the oscilloscope demo including
 *     WebSocket connection state, streaming status, data rate, buffer size, and FPS.
 *     Features visual indicators for quick status recognition.
 * Dependencies: React, oscilloscope types and constants
 * Exports: StatusPanel component
 * Interfaces: Props interface for status data
 * Implementation: Clean status display with color-coded indicators and performance metrics
 */

import React, { useMemo } from 'react';
import type { StatusPanelProps } from '../../types/oscilloscope.types';
import styles from './StatusPanel.module.css';

const StatusPanelComponent: React.FC<StatusPanelProps> = ({ state, stats }) => {
  const connectionStatusColor = useMemo(
    () => (state.isConnected ? '#00ff00' : '#ff4444'),
    [state.isConnected],
  );

  const streamingStatusColor = useMemo(
    () => (state.isStreaming ? '#00ff00' : '#666'),
    [state.isStreaming],
  );

  const formattedDataRate = useMemo(() => {
    if (stats.dataRate >= 1000) {
      return `${(stats.dataRate / 1000).toFixed(1)}k S/s`;
    }
    return `${stats.dataRate} S/s`;
  }, [stats.dataRate]);

  const formattedBufferSize = useMemo(
    () => `${stats.bufferSize.toLocaleString()} samples`,
    [stats.bufferSize],
  );

  const performanceColor = useMemo(
    () => (stats.fps >= 30 ? '#00ff00' : stats.fps >= 15 ? '#ffa500' : '#ff4444'),
    [stats.fps],
  );

  const performanceLabel = useMemo(
    () => (stats.fps >= 30 ? 'Excellent' : stats.fps >= 15 ? 'Good' : 'Poor'),
    [stats.fps],
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Connection Status</h3>
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <span className={styles.label}>Connection:</span>
          <span className={styles.value} style={{ color: connectionStatusColor }}>
            {state.isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Streaming:</span>
          <span className={styles.value} style={{ color: streamingStatusColor }}>
            {state.isStreaming ? '● Active' : '○ Inactive'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Data Rate:</span>
          <span className={styles.value}>{formattedDataRate}</span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Buffer:</span>
          <span className={styles.value}>{formattedBufferSize}</span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>FPS:</span>
          <span className={styles.value}>{stats.fps}</span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Performance:</span>
          <span
            className={`${styles.value} ${styles.performance}`}
            style={{ color: performanceColor }}
          >
            {performanceLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export const StatusPanel = React.memo(StatusPanelComponent);
