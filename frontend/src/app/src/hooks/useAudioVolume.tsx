import { useEffect, useState, useRef } from "react";

interface UseAudioVolumeOptions {
  /** External MediaStream to analyze (avoids creating a second microphone stream) */
  externalStream?: MediaStream | null;
  /** Whether volume analysis should be active */
  enabled?: boolean;
}

interface UseAudioVolumeReturn {
  volume: number;
  error: string | null;
  isReady: boolean;
}

/**
 * Hook to analyze audio volume from a MediaStream.
 * When provided with an external stream, reuses it instead of requesting a new one.
 * This prevents the "double microphone stream" issue.
 */
export function useAudioVolume(
  options: UseAudioVolumeOptions = {}
): UseAudioVolumeReturn {
  const { externalStream = null, enabled = true } = options;

  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    // Don't run if disabled or no stream provided
    if (!enabled || !externalStream) {
      setVolume(0);
      setIsReady(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const setup = async () => {
      try {
        const AC = (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext;

        if (!AC) {
          setError("AudioContext not supported in this browser");
          return;
        }

        const audioContext = new AC();
        audioContextRef.current = audioContext;

        // Resume if suspended (Safari/iOS autoplay policies)
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(externalStream);
        source.connect(analyser);
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (isCancelled) return;

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolume(avg / 255);
          rafIdRef.current = requestAnimationFrame(tick);
        };

        tick();
        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error("Error setting up audio analysis:", err);
        setError(err instanceof Error ? err.message : "Audio analysis failed");
        setIsReady(false);
      }
    };

    setup();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafIdRef.current);

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setVolume(0);
    };
  }, [externalStream, enabled]);

  return { volume, error, isReady };
}
