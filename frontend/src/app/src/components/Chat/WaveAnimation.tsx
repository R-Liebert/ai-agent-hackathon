import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const START_THRESHOLD = 0.07; // start speaking when volume crosses this
const STOP_THRESHOLD = 0.05; // stop speaking only when volume falls below this
const BOOST_MULTIPLIER = 140;

const BAR_WIDTH = 2; // px
const BAR_GAP = 2; // px
const MAX_BARS = 800; // safety cap
const BASE_GRAY_HEIGHT = 3;

const VOLUME_ATTACK_RATE = 5.0; // how fast smoothedVolume rises when speaking
const VOLUME_RELEASE_RATE = 2.5; // how fast smoothedVolume falls when silent
const ENV_ATTACK_RATE = 5.0; // how fast the envelope rises (0 -> 1)
const ENV_RELEASE_RATE = 2.0; // how fast the envelope falls (1 -> 0)

interface WaveAnimationProps {
  isRecording?: boolean;
  volume: number;
  revealSeconds?: number; // default 27 in your example
}

export default function WaveAnimation({
  isRecording = false,
  volume,
  revealSeconds = 27,
}: WaveAnimationProps) {
  // Measure container for precise bar count
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const update = () => setContainerWidth(el.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Compute number of bars to fill the container
  const numberOfBars = useMemo(() => {
    if (!containerWidth) return 0;
    const n = Math.ceil((containerWidth + BAR_GAP) / (BAR_WIDTH + BAR_GAP));
    return Math.max(1, Math.min(n, MAX_BARS));
  }, [containerWidth]);

  // Simple speaking detection (used for the latch only)
  const isSpeakingSimple = isRecording && volume >= START_THRESHOLD;

  // Latch: once the user starts speaking, keep reveal moving even if they pause
  const [hasSpeechStarted, setHasSpeechStarted] = useState(false);
  useEffect(() => {
    if (!isRecording) {
      setHasSpeechStarted(false);
      return;
    }
    if (isSpeakingSimple) {
      setHasSpeechStarted(true);
    }
  }, [isRecording, isSpeakingSimple]);

  // Progressive reveal: 0 → 100% in revealSeconds after speech has started
  const [revealProgress, setRevealProgress] = useState(0);
  const lastTimeRef = useRef<number | null>(null);

  // Smoothed volume and envelope (for gentler height changes)
  const [smoothedVolume, setSmoothedVolume] = useState(volume);
  const [envelope, setEnvelope] = useState(0); // 0..1

  // Hysteresis speaking gate (prevents jitter near thresholds)
  const prevSpeakingRef = useRef(false);

  const smoothStep = (
    current: number,
    target: number,
    rate: number,
    delta: number
  ) => {
    // Exponential smoothing independent of frame rate
    const alpha = 1 - Math.exp(-rate * delta);
    return current + (target - current) * alpha;
  };

  useEffect(() => {
    if (!isRecording) {
      // Reset when not recording
      setRevealProgress(0);
      lastTimeRef.current = null;
      setSmoothedVolume(volume);
      setEnvelope(0);
      prevSpeakingRef.current = false;
      return;
    }

    let rafId: number;
    const tick = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(0.1, (time - lastTimeRef.current) / 1000); // clamp delta for stability
      lastTimeRef.current = time;

      // Keep revealing after speech has started (latch), not only while actively speaking
      if (hasSpeechStarted) {
        setRevealProgress((p) =>
          Math.min(1, p + delta / Math.max(0.001, revealSeconds))
        );
      }

      // Hysteresis speaking detection:
      // - If we were speaking, only stop when below STOP_THRESHOLD
      // - If we were silent, only start when above START_THRESHOLD
      const wasSpeaking = prevSpeakingRef.current;
      const speakingGate = wasSpeaking
        ? volume >= STOP_THRESHOLD
        : volume >= START_THRESHOLD;
      prevSpeakingRef.current = speakingGate;

      // Smooth volume: faster attack, slower release
      const volRate = speakingGate ? VOLUME_ATTACK_RATE : VOLUME_RELEASE_RATE;
      setSmoothedVolume((v) => smoothStep(v, volume, volRate, delta));

      // Envelope for height ramp: faster up, slower down for gentle stop
      const envTarget = speakingGate ? 1 : 0;
      const envRate = speakingGate ? ENV_ATTACK_RATE : ENV_RELEASE_RATE;
      setEnvelope((e) => smoothStep(e, envTarget, envRate, delta));

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRecording, hasSpeechStarted, revealSeconds, volume]);

  // Stable random factors per bar (same look as before)
  const unitFactors = useMemo(
    () =>
      Array.from({ length: numberOfBars }, () => Math.random() * 0.7 + 0.14),
    [numberOfBars]
  );

  // Compute the gentle white base height:
  // - boosted is derived from smoothedVolume (never below baseline)
  // - envelope blends between baseline (0) and boosted (1)
  const boostedSpeakingHeight = useMemo(() => {
    const boosted = Math.pow(smoothedVolume || 0.15, 0.7) * BOOST_MULTIPLIER;
    return Math.max(BASE_GRAY_HEIGHT, boosted);
  }, [smoothedVolume]);

  const whiteBaseHeight = useMemo(() => {
    return (
      BASE_GRAY_HEIGHT + envelope * (boostedSpeakingHeight - BASE_GRAY_HEIGHT)
    );
  }, [envelope, boostedSpeakingHeight]);

  if (!isRecording) return null;

  // Widths and split counts
  const overlayWidthPx = revealProgress * containerWidth;
  const leftWidthPx = containerWidth - overlayWidthPx;

  // Left (black) side: floor so it never intrudes under the overlay
  const leftBarCount =
    leftWidthPx > 0
      ? Math.max(
          0,
          Math.min(
            numberOfBars,
            Math.floor((leftWidthPx + BAR_GAP) / (BAR_WIDTH + BAR_GAP))
          )
        )
      : 0;

  // Right (white) side: the rest of the bars
  const overlayBarCount = Math.max(0, numberOfBars - leftBarCount);

  const leftFactors =
    leftBarCount > 0 ? unitFactors.slice(0, leftBarCount) : [];
  const overlayFactors =
    overlayBarCount > 0
      ? unitFactors.slice(numberOfBars - overlayBarCount)
      : [];

  return (
    <div ref={containerRef} className="relative w-full h-12 overflow-hidden">
      {/* BASE WAVE (black) */}
      <div
        className="absolute left-0 inset-y-0 flex items-center flex-nowrap mb-2"
        style={{ gap: `${BAR_GAP}px` }}
      >
        {leftFactors.map((_, i) => (
          <div
            key={`base-${i}`}
            className="rounded-full shrink-0"
            style={{
              width: `${BAR_WIDTH}px`,
              height: BASE_GRAY_HEIGHT,
              backgroundColor: "#000000",
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* ANIMATED TRANSCRIBE WAVE: reveals from the right */}
      <AnimatePresence>
        {revealProgress > 0 && overlayBarCount > 0 && (
          <motion.div
            className="absolute inset-y-0 right-0 overflow-hidden mb-2"
            style={{ width: `${revealProgress * 100}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute right-0 inset-y-0 flex items-center flex-nowrap justify-end"
              style={{ gap: `${BAR_GAP}px` }}
            >
              {overlayFactors.map((factor, i) => (
                <div
                  key={`overlay-${i}`}
                  className="rounded-full shrink-0"
                  style={{
                    width: `${BAR_WIDTH}px`,
                    height: whiteBaseHeight * factor,
                    backgroundColor: "#ffffff",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
