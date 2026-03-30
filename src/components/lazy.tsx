import { ComponentType, Suspense, lazy } from 'react';

/**
 * Lazy load heavy components with a loading fallback
 */

// Visualizer - heavy canvas drawing
export const VisualizerLazy = lazy(() => 
  import('./Visualizer').then(m => ({ default: m.default }))
);

// InstrumentEditor - complex UI with many controls
export const InstrumentEditorLazy = lazy(() =>
  import('./InstrumentEditor').then(m => ({ default: m.default }))
);

/**
 * Loading fallback component
 */
export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-4 text-gray-600 text-[10px] tracking-widest uppercase">
      Loading...
    </div>
  );
}

/**
 * Wrap lazy component with Suspense boundary
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}
