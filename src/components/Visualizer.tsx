import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { getAnalyser } from '../audio/synth';
import { useSequencerStore } from '../store/sequencerStore';

type Mode = 'spectrum' | 'waveform' | 'bars';

export default memo(function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [mode, setMode] = useState<Mode>('bars');
  const modeRef = useRef<Mode>('bars');
  const peaksRef = useRef<Float32Array | null>(null);
  const peakDecayRef = useRef<number[]>([]);

  const isPlaying = useSequencerStore(s => s.isPlaying);
  const currentStep = useSequencerStore(s => s.currentStep);
  const currentPatternId = useSequencerStore(s => s.currentPatternId);
  const patterns = useSequencerStore(s => s.patterns);
  const instruments = useSequencerStore(s => s.instruments);
  const currentPattern = useMemo(
    () => patterns.find(p => p.id === currentPatternId),
    [patterns, currentPatternId],
  );
  const activeInstruments = useMemo(() => instruments.slice(0, 8), [instruments]);
  const isPlayingRef = useRef(isPlaying);
  const currentStepRef = useRef(currentStep);
  const currentPatternRef = useRef(currentPattern);
  const instrumentsRef = useRef(activeInstruments);
  isPlayingRef.current = isPlaying;
  currentStepRef.current = currentStep;
  currentPatternRef.current = currentPattern;
  instrumentsRef.current = activeInstruments;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d')!;

    if (!analyserRef.current) {
      try {
        analyserRef.current = getAnalyser();
      } catch { return; }
    }

    const analyser = analyserRef.current;
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);


    let frame = 0;
    let lastDrawTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const draw = (timestamp: number) => {
      animRef.current = requestAnimationFrame(draw);

      // Throttle to ~30fps
      const elapsed = timestamp - lastDrawTime;
      if (elapsed < FRAME_INTERVAL) return;
      lastDrawTime = timestamp - (elapsed % FRAME_INTERVAL);

      frame++;

      const W = canvas.width;
      const H = canvas.height;
      const m = modeRef.current;

      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      // Background
      ctx2d.fillStyle = 'rgba(9, 14, 26, 0.88)';
      ctx2d.fillRect(0, 0, W, H);

      if (m === 'bars') {
        // Chunky pixelated bar chart with peaks
        const numBars = 32;
        const binStep = Math.floor(freqData.length / numBars);
        const barW = (W / numBars) - 1;
        if (!peaksRef.current || peaksRef.current.length !== numBars) {
          peaksRef.current = new Float32Array(numBars);
          peakDecayRef.current = new Array(numBars).fill(0);
        }

        for (let i = 0; i < numBars; i++) {
          // Average bins for this bar
          let sum = 0;
          for (let j = 0; j < binStep; j++) sum += freqData[i * binStep + j];
          const v = sum / binStep / 255;

          const x = i * (W / numBars);
          const barH = v * (H - 4);

          // Peak hold
          if (v > peaksRef.current![i]) {
            peaksRef.current![i] = v;
            peakDecayRef.current![i] = 60;
          } else {
            peakDecayRef.current![i]--;
            if (peakDecayRef.current![i] <= 0) {
              peaksRef.current![i] = Math.max(0, peaksRef.current![i] - 0.008);
            }
          }

          const hue = 160 + (i / numBars) * 200;
          const color = `hsl(${hue}, 100%, ${50 + v * 25}%)`;

          // Pixelated blocks
          const blockSize = 4;
          const numBlocks = Math.floor(barH / blockSize);
          for (let b = 0; b < numBlocks; b++) {
            const by = H - (b + 1) * blockSize - 2;
            const alpha = 0.6 + (b / numBlocks) * 0.4;
            ctx2d.fillStyle = color;
            ctx2d.globalAlpha = alpha;
            ctx2d.fillRect(x, by, barW, blockSize - 1);
          }
          ctx2d.globalAlpha = 1;

          // Peak line
          const peakY = H - peaksRef.current![i] * (H - 4) - 2;
          ctx2d.fillStyle = '#fff';
          ctx2d.globalAlpha = 0.7;
          ctx2d.fillRect(x, peakY, barW, 2);
          ctx2d.globalAlpha = 1;
        }

        // Beat indicator dots at top
        const pattern = currentPatternRef.current;
        if (pattern && isPlayingRef.current) {
          const step = currentStepRef.current;
          const stepCount = pattern.stepCount;
          const dotSpacing = W / stepCount;
          for (let s = 0; s < stepCount; s++) {
            const dotX = s * dotSpacing + dotSpacing / 2;
            const isCur = s === step;
            ctx2d.beginPath();
            ctx2d.arc(dotX, 5, isCur ? 4 : 2, 0, Math.PI * 2);
            ctx2d.fillStyle = isCur ? '#4ade80' : '#1f2937';
            ctx2d.fill();
          }
        }

      } else if (m === 'spectrum') {
        // Smooth spectrum
        const n = freqData.length;
        const barW2 = W / n * 1.8;
        let x = 0;
        for (let i = 0; i < n; i++) {
          const v = freqData[i] / 255;
          const barH = v * H;
          const hue = 120 + v * 200;
          ctx2d.fillStyle = `hsla(${hue}, 100%, ${50 + v * 30}%, 0.8)`;
          ctx2d.fillRect(x, H - barH, barW2, barH);
          x += barW2 + 0.5;
        }

        // Grid lines
        ctx2d.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx2d.lineWidth = 1;
        for (let y = 0; y < H; y += 8) {
          ctx2d.beginPath();
          ctx2d.moveTo(0, y);
          ctx2d.lineTo(W, y);
          ctx2d.stroke();
        }

      } else if (m === 'waveform') {
        // Oscilloscope waveform
        const n = timeData.length;
        const sliceW = W / n;

        // Main line
        ctx2d.strokeStyle = '#4ade80';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        for (let i = 0; i < n; i++) {
          const v = timeData[i] / 128 - 1;
          const x = i * sliceW;
          const y = (v * H * 0.42) + H / 2;
          i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
        }
        ctx2d.stroke();

        // Center line
        ctx2d.strokeStyle = '#1f2937';
        ctx2d.lineWidth = 1;
        ctx2d.shadowBlur = 0;
        ctx2d.beginPath();
        ctx2d.moveTo(0, H / 2);
        ctx2d.lineTo(W, H / 2);
        ctx2d.stroke();

        // Instrument level meters on right
        const activeInsts = instrumentsRef.current;
        activeInsts.forEach((inst, idx) => {
          const energy = freqData[Math.floor(idx * 8)] / 255;
          const mh = H / activeInsts.length;
          const my = idx * mh;
          const mw = 4;
          ctx2d.fillStyle = inst.color;
          ctx2d.globalAlpha = 0.6;
          ctx2d.fillRect(W - mw - 2, my + mh * (1 - energy), mw, mh * energy);
          ctx2d.globalAlpha = 1;
        });

        // Active step highlighting
        if (isPlayingRef.current) {
          const pattern = currentPatternRef.current;
          if (pattern) {
            const step = currentStepRef.current;
            const x = (step / pattern.stepCount) * W;
            ctx2d.fillStyle = 'rgba(74, 222, 128, 0.07)';
            ctx2d.fillRect(x, 0, W / pattern.stepCount, H);
          }
        }
      }

      // ── Activity indicator (frame counter) ──
      if (!isPlayingRef.current) {
        ctx2d.fillStyle = 'rgba(255,255,255,0.03)';
        ctx2d.fillRect(0, H - 2, (frame % 100) * W / 100, 2);
      }

      // ── Scanline overlay ──
      ctx2d.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 4) {
        ctx2d.fillRect(0, y, W, 1);
      }
    };

    draw(0);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={512}
        height={56}
        className="w-full rounded-xl"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Mode buttons */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {(['bars', 'spectrum', 'waveform'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide transition-all ${
              mode === m
                ? 'bg-white/20 text-white'
                : 'bg-black/30 text-gray-600 hover:text-gray-400'
            }`}
          >{m === 'bars' ? 'BAR' : m === 'spectrum' ? 'FFT' : 'OSC'}</button>
        ))}
      </div>
    </div>
  );
});
