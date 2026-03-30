/**
 * Low-power mode utilities
 * Reduces rendering and effect load for better performance on lower-end devices
 */

export interface LowPowerConfig {
  enabled: boolean;
  disableVisualizer: boolean;
  disableCRTEffect: boolean;
  disableScanlines: boolean;
  reducedAnalyserFftSize: boolean;
  throttleRefreshMS: number;
}

const DEFAULT_CONFIG: LowPowerConfig = {
  enabled: false,
  disableVisualizer: false,
  disableCRTEffect: false,
  disableScanlines: false,
  reducedAnalyserFftSize: false,
  throttleRefreshMS: 0,
};

let config: LowPowerConfig = { ...DEFAULT_CONFIG };

export function getLowPowerMode(): LowPowerConfig {
  return { ...config };
}

export function setLowPowerMode(enabled: boolean): void {
  config.enabled = enabled;
  if (enabled) {
    // When low-power is enabled, disable heavy features
    config.disableVisualizer = true;
    config.disableCRTEffect = true;
    config.disableScanlines = true;
    config.reducedAnalyserFftSize = true;
    config.throttleRefreshMS = 33; // ~30fps instead of 60fps
  } else {
    config = { ...DEFAULT_CONFIG };
  }
  // Notify listeners (could dispatch event or use store)
  document.dispatchEvent(new CustomEvent('lowpowermodechange', { detail: config }));
}

export function shouldRender(key: keyof Omit<LowPowerConfig, 'enabled' | 'throttleRefreshMS'>): boolean {
  if (!config.enabled) return true;
  return !config[key];
}

export function getAnalyserFftSize(): number {
  if (config.enabled && config.reducedAnalyserFftSize) {
    return 256; // Reduced from 512
  }
  return 512;
}

export function getRefreshThrottle(): number {
  return config.throttleRefreshMS;
}
