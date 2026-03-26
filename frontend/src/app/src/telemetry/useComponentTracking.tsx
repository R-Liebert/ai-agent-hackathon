import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface TrackingData {
  hookTimestamp: number;
  firstActiveTimestamp: number;
  totalIdleTime: number;
  lastActiveTimestamp: number;
  idleStartTimestamp: number;
  idleCount: number;
  idleTimeout: number;
}

const tracking: Map<string, TrackingData> = new Map();

function getEngagementTimeSeconds(t: TrackingData): number {
  return (
    (Date.now() -
      t.firstActiveTimestamp -
      t.totalIdleTime -
      t.idleCount * t.idleTimeout) /
    1000
  );
}

const useComponentTracking = (
  reactPlugin: ReactPlugin,
  componentName: string
): (() => void) => {
  const guid = uuidv4();
  const trackingId = `${componentName}:${guid}`;
  tracking.set(trackingId, {
    hookTimestamp: Date.now(),
    firstActiveTimestamp: 0,
    totalIdleTime: 0,
    lastActiveTimestamp: 0,
    idleStartTimestamp: 0,
    idleCount: 0,
    idleTimeout: 5000,
  });

  const savedCallback = useRef<() => void>();

  const callback = () => {
    const trackedData = tracking.get(trackingId);
    if (
      trackedData &&
      trackedData.lastActiveTimestamp > 0 &&
      trackedData.idleStartTimestamp === 0 &&
      Date.now() - trackedData.lastActiveTimestamp >= trackedData.idleTimeout
    ) {
      trackedData.idleStartTimestamp = Date.now();
      trackedData.idleCount++;
    }
  };
  const delay = 100;

  savedCallback.current = callback;

  // Set up the interval.
  useEffect(() => {
    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => {
      clearInterval(id);

      const trackedData = tracking.get(trackingId);
      tracking.delete(trackingId);

      if (!trackedData) return;

      if (trackedData.hookTimestamp === 0) {
        throw new Error(
          "useComponentTracking: unload hook: hookTimestamp is not initialized."
        );
      }

      if (trackedData.firstActiveTimestamp === 0) {
        return;
      }

      const engagementTime = getEngagementTimeSeconds(trackedData);
      const metricData = {
        average: engagementTime,
        name: "React Component Engaged Time (seconds)",
        sampleCount: 1,
      };

      const additionalProperties = { "Component Name": componentName };
      reactPlugin.trackMetric(metricData, additionalProperties);
    };
  }, []);

  const trackActivity = () => {
    const t = tracking.get(trackingId);
    if (!t) return;

    if (t.firstActiveTimestamp === 0) {
      t.firstActiveTimestamp = Date.now();
      t.lastActiveTimestamp = t.firstActiveTimestamp;
    } else {
      t.lastActiveTimestamp = Date.now();
    }

    if (t.idleStartTimestamp > 0) {
      const lastIdleTime = t.lastActiveTimestamp - t.idleStartTimestamp;
      t.totalIdleTime += lastIdleTime;
      t.idleStartTimestamp = 0;
    }
  };

  return trackActivity;
};

export default useComponentTracking;
