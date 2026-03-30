import React, { memo } from 'react';

const GROUP = 4;

interface StepCellProps {
  trackIdx: number;
  stepIdx: number;
  isActive: boolean;
  velocity: number;
  accent: boolean;
  note: number;
  isCurrent: boolean;
  isPlaying: boolean;
  instColor: string;
  stepCount: number;
  muted: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
}

/**
 * Memoized step cell - avoids re-render when sibling cells change
 */
export const StepCell = memo<StepCellProps>(({
  stepIdx,
  isActive,
  velocity,
  accent,
  note,
  isCurrent,
  instColor,
  muted,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onPointerCancel,
}) => {
  const velH = Math.round(velocity * 100);
  const isGroupStart = stepIdx % GROUP === 0 && stepIdx !== 0;

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`relative flex-1 h-8 sm:h-9 rounded-sm sm:rounded transition-all select-none touch-none ${
        isGroupStart ? 'ml-0.5 sm:ml-1' : ''
      } ${isCurrent && !isActive ? 'ring-1 ring-inset ring-white/30' : ''}`}
      style={{
        backgroundColor: isActive
          ? instColor
          : (Math.floor(stepIdx / GROUP) % 2 === 0 ? '#1e293b' : '#172033'),
        opacity: muted ? 0.3 : isActive ? Math.max(0.35, velocity) : 0.9,
        boxShadow: isCurrent && isActive
          ? `0 0 16px ${instColor}cc, 0 0 5px ${instColor}`
          : isActive
          ? `0 0 5px ${instColor}66`
          : undefined,
        transform: isCurrent ? 'scaleY(1.08)' : undefined,
      }}
    >
      {/* Velocity bar at bottom */}
      {isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b"
          style={{
            height: `${velH}%`,
            background: `linear-gradient(to top, ${instColor}cc, transparent)`,
            opacity: 0.4,
          }}
        />
      )}
      {/* Accent star */}
      {accent && isActive && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/60 font-black pointer-events-none leading-none">★</span>
      )}
      {/* Note indicator (if non-zero) */}
      {isActive && note !== 0 && (
        <span
          className="absolute bottom-0.5 right-0.5 text-[6px] font-mono font-bold text-black/50 leading-none pointer-events-none"
        >{note > 0 ? `+${note}` : note}</span>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props change
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.velocity === nextProps.velocity &&
    prevProps.accent === nextProps.accent &&
    prevProps.note === nextProps.note &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.muted === nextProps.muted &&
    prevProps.instColor === nextProps.instColor
  );
});

StepCell.displayName = 'StepCell';

interface PlayheadIndicatorProps {
  stepIdx: number;
  stepCount: number;
  currentStep: number;
  isPlaying: boolean;
}

/**
 * Separate playhead indicator - can update independently  
 */
export const PlayheadIndicator = memo<PlayheadIndicatorProps>(({
  stepIdx,
  currentStep,
  isPlaying,
}) => {
  const isBar = stepIdx % GROUP === 0;
  const isCurrent = stepIdx === currentStep && isPlaying;

  return (
    <div
      className={`flex-1 text-center text-[8px] sm:text-[9px] font-mono leading-none py-0.5 transition-all ${
        stepIdx % GROUP === 0 ? 'ml-0.5 sm:ml-1' : ''
      } ${
        isCurrent
          ? 'text-white font-bold'
          : isBar
          ? 'text-gray-600'
          : 'text-gray-800'
      }`}
    >
      {isBar ? (stepIdx / GROUP + 1) : '·'}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.stepIdx === nextProps.stepIdx
  );
});

PlayheadIndicator.displayName = 'PlayheadIndicator';
