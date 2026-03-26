import { appInsights } from "../telemetry/AppInsights";

// Define TrackMetricModel
export class TrackMetricModel {
  metric: string;
  labels: Record<string, string>;

  constructor(metric: string, labels: Record<string, string> = {}) {
    this.metric = metric;
    this.labels = labels;
  }
}

class LaunchpadMetrics {
  private static instance: LaunchpadMetrics | null = null;
  
  public static getInstance(): LaunchpadMetrics {
    if (!LaunchpadMetrics.instance) {
      LaunchpadMetrics.instance = new LaunchpadMetrics();
    }
    return LaunchpadMetrics.instance;
  }

  // Track Metric Event
  public async track(event: TrackMetricModel): Promise<void> {
    return new Promise((resolve, _) => {
        appInsights.trackEvent({name: event.metric,properties: event.labels});
        appInsights.flush();
        resolve();
    });
  }
}

const launchpadMetrics = LaunchpadMetrics.getInstance();
export default launchpadMetrics;