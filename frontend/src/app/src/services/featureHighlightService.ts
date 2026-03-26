import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import launchpadMetrics from "./launchpadMetrics";
import i18next, { TFunction } from "i18next";

export interface HighlightStep {
  elementId: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface HighlightConfig {
  featureId: string;
  userId?: string;
  buttonText?: string;
  trackMetric?: boolean;
  metricName?: string;
  animate?: boolean;
  allowClose?: boolean;
  overlayOpacity?: number;
  onBeforeShow?: () => void | Promise<void>;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export interface EntrySourceConfig {
  appName: string;

  welcome?: {
    enabled: boolean;
    title?: string;
    description?: string;
  };

  prompt?: string; // Unified prompt
  requiresUpload?: boolean;
  autoTriggerUpload?: boolean;
}

/**
 * Translated source config.
 */
const buildSourceConfigs = (
  t?: TFunction
): Record<string, EntrySourceConfig> => {
  const translate = t ?? i18next.t.bind(i18next);

  return {
    "image-creator": {
      appName: translate("dsb-chat:featureIntegration.imageCreator.appName"),
      welcome: {
        enabled: true,
        title: translate(
          "dsb-chat:featureIntegration.imageCreator.welcome.title"
        ),
        description: translate(
          "dsb-chat:featureIntegration.imageCreator.welcome.description"
        ),
      },
      prompt: translate("dsb-chat:featureIntegration.imageCreator.prompt"),
      requiresUpload: false,
    },

    "doc-chat": {
      appName: translate("dsb-chat:featureIntegration.docChat.appName"),
      welcome: {
        enabled: true,
        title: translate("dsb-chat:featureIntegration.docChat.welcome.title"),
        description: translate(
          "dsb-chat:featureIntegration.docChat.welcome.description"
        ),
      },
      prompt: translate("dsb-chat:featureIntegration.docChat.prompt"),
      requiresUpload: true,
      autoTriggerUpload: true,
    },

    "meeting-notes": {
      appName: translate("dsb-chat:featureIntegration.meetingNotes.appName"),
      welcome: {
        enabled: true,
        title: translate(
          "dsb-chat:featureIntegration.meetingNotes.welcome.title"
        ),
        description: translate(
          "dsb-chat:featureIntegration.meetingNotes.welcome.description"
        ),
      },
      prompt: translate("dsb-chat:featureIntegration.meetingNotes.prompt"),
      requiresUpload: true,
      autoTriggerUpload: true,
    },

    "doc-converter": {
      appName: translate("dsb-chat:featureIntegration.docConverter.appName"),
      welcome: {
        enabled: true,
        title: translate(
          "dsb-chat:featureIntegration.docConverter.welcome.title"
        ),
        description: translate(
          "dsb-chat:featureIntegration.docConverter.welcome.description"
        ),
      },
      prompt: translate("dsb-chat:featureIntegration.docConverter.prompt"),
      requiresUpload: true,
      autoTriggerUpload: true,
    },
  };
};
/**
 * Registry overlay for dynamically registered source configs.
 */
const REGISTERED_SOURCE_CONFIGS: Record<string, EntrySourceConfig> = {};
const ALWAYS_SHOW_WELCOME_SOURCES = new Set([
  "image-creator",
  "doc-chat",
  "meeting-notes",
  "doc-converter",
]);

const defaultDriverConfig: Partial<HighlightConfig> = {
  trackMetric: true,
  metricName: "launchpad_ui_feature_highlight_shown_count",
  animate: true,
  allowClose: true,
  overlayOpacity: 0.5,
};

let activeDriverInstance: Driver | null = null;

/**
 * Localized button label
 */
const getFeatureButtonText = (t?: TFunction): string => {
  const translate = t ?? i18next.t.bind(i18next);
  return translate("dsb-chat:featureIntegration.buttonText");
};

/**
 * Base styles shared by all popups
 */
const getBasePopoverStyles = () => `
  .driver-popover {
    background-color: #212121 !important;
    border-radius: 12px !important;
    border: 1px solid #3A3A3D !important;
    font-family: "Nunito Sans", sans-serif !important;
    box-shadow: none !important;
  }
  .driver-popover-title {
    color: #ffffff !important;
    font-size: 1.15rem !important;
    font-weight: 600 !important;
    font-family: "Nunito Sans", sans-serif !important;
    margin-bottom: 8px !important;
  }
  .driver-popover-description {
    color: #e0e0e0 !important;
    font-size: 0.95rem !important;
    font-family: "Nunito Sans", sans-serif !important;
    line-height: 1.6 !important;
  }
  .driver-popover-footer {
    background-color: #212121 !important;
    border-top: none !important;
    padding-top: 12px !important;
    margin-top: 8px !important;
  }
  .driver-popover-footer button {
    background-color: #ffffff !important;
    color: #333333 !important;
    border-radius: 9999px !important;
    padding: 10px 28px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    text-transform: none !important;
    font-size: 0.95rem !important;
    border: none !important;
    font-family: "Nunito Sans", sans-serif !important;
    cursor: pointer !important;
  }
  .driver-prev-btn {
    display: none !important;
  }
`;

/**
 * Ensure base styles are injected exactly once
 */
const ensureBasePopoverStylesInjected = () => {
  if (typeof document === "undefined") return;
  const id = "driver-base-popover-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = getBasePopoverStyles();
  document.head.appendChild(style);
};

/**
 * Styles for the upload highlight popover (WITH element highlighting)
 * Only variant-specific overrides; base is injected separately.
 */
const getHighlightFileUploadStyles = () => {
  const styleElement = document.createElement("style");
  styleElement.id = "driver-highlight-file-upload-styles";
  styleElement.textContent = `
    .driver-overlay {
      opacity: 0.5 !important;
      background-color: rgba(33, 33, 33, 0.6) !important;
    }

    /* Slightly lighter description for upload variant */
    .driver-popover.file-upload-popover .driver-popover-description {
      color: #e2e2e2 !important;
    }

    /* Color-only arrow styling to avoid geometry issues */
    .driver-popover-arrow-side-top { border-top-color: #3A3A3D !important; }
    .driver-popover-arrow-side-bottom { border-bottom-color: #3A3A3D !important; }
    .driver-popover-arrow-side-left { border-left-color: #3A3A3D !important; }
    .driver-popover-arrow-side-right { border-right-color: #3A3A3D !important; }

    .driver-popover-arrow-side-top::before { border-bottom-color: #212121 !important; }
    .driver-popover-arrow-side-bottom::before { border-top-color: #212121 !important; }
    .driver-popover-arrow-side-left::before { border-right-color: #212121 !important; }
    .driver-popover-arrow-side-right::before { border-left-color: #212121 !important; }

    /* Optional: force visual arrow centering for upload step only */
    .driver-popover.file-upload-popover .driver-popover-arrow-side-top,
    .driver-popover.file-upload-popover .driver-popover-arrow-side-bottom {
      left: 7% !important;
    }
    .driver-popover.file-upload-popover .driver-popover-arrow-side-left,
    .driver-popover.file-upload-popover .driver-popover-arrow-side-right {
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    /* Keep highlight element styling lightweight */
    .driver-active-element#tools-menu-upload-button,
    .driver-highlighted-element#tools-menu-upload-button {
      background-color: #181818 !important;
      border-radius: 50% !important;
      box-shadow: none !important;
      border: transparent !important;
      transition: background-color 0.3s ease !important;
      cursor: pointer !important;
    }

    .driver-active-element#dsb-chat-input,
    .driver-highlighted-element#dsb-chat-input {
      background-color: #181818 !important;
    }
  `;
  return styleElement;
};

/**
 * Styles for the feature integration welcome popup
 * Only variant-specific overrides; base is injected separately.
 */
const getFeatureIntegrationStyles = () => {
  const styleElement = document.createElement("style");
  styleElement.id = "driver-feature-integration-styles";
  styleElement.textContent = `
    .driver-overlay {
      opacity: 0.8 !important;
      background-color: rgba(20, 20, 20, 0.8) !important;
    }

    /* Welcome-only visual tweaks. No position overrides! */
    .driver-popover.welcome {
      border-radius: 20px !important;
      box-shadow: none !important;
    }

    /* Hide arrow for welcome to avoid pointing to center anchor */
    .driver-popover.welcome .driver-popover-arrow {
      display: none !important;
    }
  `;
  return styleElement;
};

export const cleanupDriver = () => {
  // Remove any style elements we may have added
  const styleIds = [
    "driver-base-popover-styles",
    "driver-highlight-file-upload-styles",
    "driver-feature-integration-styles",
    "driver-transform-sanitizer-styles", // optional: full cleanup
    "driver-custom-styles", // legacy id cleanup
  ];
  styleIds.forEach((id) => document.getElementById(id)?.remove());

  const anchor = document.getElementById("driver-welcome-anchor");
  if (anchor) anchor.remove();

  if (activeDriverInstance) {
    try {
      activeDriverInstance.destroy();
    } catch (e) {
      console.warn("Error destroying driver instance:", e);
    }
    activeDriverInstance = null;
  }

  document
    .querySelectorAll(
      ".driver-overlay, .driver-popover, .driver-active-element, #driver-highlighted-element-stage"
    )
    .forEach((el) => el.remove());
};

const waitForVisibleRect = (selector: string, timeout = 2000) =>
  new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      const rect = el?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) return resolve();
      if (performance.now() - start > timeout) return resolve(); // fail-soft
      requestAnimationFrame(tick);
    };
    tick();
  });

/* Optional helpers: improve positioning stability on tablets */
const findScrollableAncestor = (el: HTMLElement | null): HTMLElement => {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const st = getComputedStyle(node);
    const overflowY = st.overflowY;
    const overflowX = st.overflowX;
    const isScrollable =
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowX === "auto" ||
      overflowX === "scroll";
    if (isScrollable) return node;
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement) || document.documentElement;
};

const centerTargetInViewport = (selector: string) => {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;

  const container = findScrollableAncestor(el);
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const currentScrollLeft =
    container === document.documentElement || container === document.body
      ? window.scrollX
      : container.scrollLeft;
  const currentScrollTop =
    container === document.documentElement || container === document.body
      ? window.scrollY
      : container.scrollTop;

  const deltaX =
    elRect.left +
    currentScrollLeft -
    (containerRect.left + (containerRect.width / 2 - elRect.width / 2));
  const deltaY =
    elRect.top +
    currentScrollTop -
    (containerRect.top + (containerRect.height / 2 - elRect.height / 2));

  if (container === document.documentElement || container === document.body) {
    window.scrollTo({
      left: deltaX,
      top: deltaY,
      behavior: "instant" as ScrollBehavior,
    });
  } else {
    container.scrollTo({
      left: deltaX,
      top: deltaY,
      behavior: "instant" as ScrollBehavior,
    });
  }
};

const getTransformedAncestor = (el: HTMLElement | null): HTMLElement | null => {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const st = getComputedStyle(node);
    const transformed =
      st.transform !== "none" ||
      st.perspective !== "none" ||
      st.filter !== "none" ||
      (st.willChange && st.willChange.includes("transform")) ||
      st.position === "fixed";
    if (transformed) return node;
    node = node.parentElement;
  }
  return null;
};

const ensureTransformSanitizerStyles = () => {
  const id = "driver-transform-sanitizer-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .driver-temp-no-transform {
      transform: none !important;
      perspective: none !important;
      filter: none !important;
    }
  `;
  document.head.appendChild(style);
};

const applyTemporaryNoTransform = (ancestor: HTMLElement | null): void => {
  if (!ancestor) return;
  ensureTransformSanitizerStyles();
  ancestor.classList.add("driver-temp-no-transform");
};

const removeTemporaryNoTransform = (ancestor: HTMLElement | null): void => {
  if (!ancestor) return;
  ancestor.classList.remove("driver-temp-no-transform");
};

/**
 * Show a generic element highlight (driver.js places popover relative to target)
 */
export const showElementHighlight = (
  steps: HighlightStep[],
  config: HighlightConfig
): Driver | null => {
  if (!steps || steps.length === 0) {
    console.error("No steps provided for element highlight");
    return null;
  }

  // Guard SSR
  if (typeof document === "undefined") {
    console.warn("showElementHighlight called on server; skipping.");
    return null;
  }

  cleanupDriver();

  const finalConfig: HighlightConfig = {
    ...defaultDriverConfig,
    ...config,
  } as HighlightConfig;

  if (finalConfig.onBeforeShow) {
    const result = finalConfig.onBeforeShow();
    if (result instanceof Promise) result.catch(console.error);
  }

  // Inject base once, then variant-specific styles
  ensureBasePopoverStylesInjected();
  const styleElement = getHighlightFileUploadStyles();
  document.head.appendChild(styleElement);

  const driverSteps = steps
    .filter((step) => document.getElementById(step.elementId))
    .map((step) => ({
      element: `#${step.elementId}`,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side || "top",
        align: step.align || "start",
      },
    }));

  // Keep a reference if we neutralize a transformed ancestor, so we can restore it
  let tempTransformedAncestor: HTMLElement | null = null;

  const driverObj = driver({
    showProgress: false,
    nextBtnText: getFeatureButtonText(),
    doneBtnText: getFeatureButtonText(),
    allowClose: finalConfig.allowClose ?? true,
    stagePadding: 6,
    stageRadius: 10,
    overlayOpacity: finalConfig.overlayOpacity,
    showButtons: ["next"],
    animate: finalConfig.animate,
    steps: driverSteps,

    onDestroyStarted: () => {
      if (finalConfig.userId) {
        markFeatureAsSeen(finalConfig.featureId, finalConfig.userId);
      }
      document.getElementById("driver-highlight-file-upload-styles")?.remove();
      if (tempTransformedAncestor) {
        removeTemporaryNoTransform(tempTransformedAncestor);
        tempTransformedAncestor = null;
      }
      finalConfig.onDismiss?.();
      driverObj.destroy();
    },
    onDestroyed: () => {
      activeDriverInstance = null;
      finalConfig.onComplete?.();
      if (tempTransformedAncestor) {
        removeTemporaryNoTransform(tempTransformedAncestor);
        tempTransformedAncestor = null;
      }
    },
  });

  activeDriverInstance = driverObj;

  // Wait until the first target has a stable rect before driving
  const firstSelector = driverSteps[0]?.element;
  if (firstSelector) {
    waitForVisibleRect(firstSelector).then(() => {
      // Neutralize transformed ancestors if present (tablet stability)
      const firstEl = document.querySelector(
        firstSelector
      ) as HTMLElement | null;
      const ancestor = getTransformedAncestor(firstEl);
      if (ancestor) {
        applyTemporaryNoTransform(ancestor);
        tempTransformedAncestor = ancestor;
      }

      // Try to center the target in its scroll container to reduce clamping
      centerTargetInViewport(firstSelector);

      // Now drive after a frame
      requestAnimationFrame(() => {
        driverObj.drive();

        // If highlighting the upload button, optionally force visual arrow centering
        const activeUpload = document.querySelector(
          ".driver-active-element#tools-menu-upload-button"
        );
        const popover = document.querySelector(
          ".driver-popover"
        ) as HTMLElement | null;
        if (activeUpload && popover) {
          popover.classList.add("file-upload-popover");
        }
      });
    });
  } else {
    driverObj.drive();
  }

  if (finalConfig.trackMetric && finalConfig.userId) {
    launchpadMetrics.track({
      metric:
        finalConfig.metricName || "launchpad_ui_feature_highlight_shown_count",
      labels: {
        featureId: finalConfig.featureId,
        userId: finalConfig.userId || "unknown",
      },
    });
  }

  return driverObj;
};

/**
 * Storage functions
 */
export const hasUserSeenFeature = (
  featureId: string,
  userId: string
): boolean =>
  !!localStorage.getItem(`feature-highlight-${featureId}-${userId}`);

export const markFeatureAsSeen = (featureId: string, userId: string): void => {
  localStorage.setItem(`feature-highlight-${featureId}-${userId}`, "true");
};

export const hasUserSeenWelcome = (
  entrySource: string,
  userId: string
): boolean => !!localStorage.getItem(`source-welcome-${entrySource}-${userId}`);

export const markWelcomeAsSeen = (
  entrySource: string,
  userId: string
): void => {
  localStorage.setItem(`source-welcome-${entrySource}-${userId}`, "true");
};

export const shouldShowWelcomePopup = (
  entrySource: string,
  userId: string
): boolean => {
  if (ALWAYS_SHOW_WELCOME_SOURCES.has(entrySource)) return true;
  return !hasUserSeenWelcome(entrySource, userId);
};

export const hasUserSeenPrompt = (
  entrySource: string,
  userId: string
): boolean => !!localStorage.getItem(`source-prompt-${entrySource}-${userId}`);

export const markPromptAsSeen = (entrySource: string, userId: string): void => {
  localStorage.setItem(`source-prompt-${entrySource}-${userId}`, "true");
};

export const resetFeatureHighlight = (
  featureId?: string,
  userId?: string
): void => {
  if (process.env.NODE_ENV !== "development") return;

  const prefixes = ["feature-highlight-", "source-prompt-", "source-welcome-"];

  if (featureId && userId) {
    prefixes.forEach((p) =>
      localStorage.removeItem(`${p}${featureId}-${userId}`)
    );
    localStorage.removeItem(`feature-highlight-${featureId}-upload-${userId}`);
  } else if (featureId) {
    Object.keys(localStorage).forEach((key) => {
      if (prefixes.some((p) => key.startsWith(`${p}${featureId}`))) {
        localStorage.removeItem(key);
      }
    });
  } else {
    Object.keys(localStorage).forEach((key) => {
      if (prefixes.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    });
  }
  console.log(
    `Feature highlight${featureId ? ` for ${featureId}` : "s"} reset!`
  );
};

/**
 * Source config functions
 */
export const getSourceConfig = (
  entrySource: string,
  t?: TFunction
): EntrySourceConfig | null => {
  // Merge built configs with any registered overrides
  const built = buildSourceConfigs(t);
  return built[entrySource] || REGISTERED_SOURCE_CONFIGS[entrySource] || null;
};

export const registerSourceConfig = (
  sourceId: string,
  config: EntrySourceConfig
): void => {
  REGISTERED_SOURCE_CONFIGS[sourceId] = config;
};

export const getPromptForSource = (
  entrySource: string,
  hasFiles: boolean,
  t?: TFunction
): string | null => {
  const config = getSourceConfig(entrySource, t);
  if (!config?.prompt) return null;
  return config.prompt || null;
};

/**
 * Unified source integration popup:
 * - Only one popup
 * - Highlights upload button if `requiresUpload`, otherwise chat input
 * - Automatically triggers file upload dialog after the popup is closed if required
 */
export const showUnifiedSourceIntegrationPopup = (
  entrySource: string,
  userId: string,
  options: {
    buttonText?: string;
    title?: string;
    description?: string;
    onComplete?: () => void;
  } = {},
  t?: TFunction
): Driver | null => {
  const config = getSourceConfig(entrySource, t);
  if (!config?.welcome?.enabled) return null;

  if (!shouldShowWelcomePopup(entrySource, userId)) return null;

  const translate = t ?? i18next.t.bind(i18next);

  const title =
    options.title || config.welcome.title || `${config.appName} Integrated`;
  const description =
    options.description || config.welcome.description || config.prompt || ""; // Use unified prompt as fallback

  const targetElementId = config.requiresUpload
    ? "tools-menu-upload-button"
    : "dsb-chat-input";

  return showElementHighlight(
    [
      {
        elementId: targetElementId,
        title,
        description,
        side: "top",
        align: "start",
      },
    ],
    {
      featureId: `${entrySource}-unified`,
      userId,
      buttonText:
        options.buttonText ??
        translate("dsb-chat:featureIntegration.buttonText"),
      trackMetric: true,
      metricName: "launchpad_ui_unified_feature_popup_shown_count",
      overlayOpacity: 0.2,
      animate: true,
      onComplete: () => {
        if (!ALWAYS_SHOW_WELCOME_SOURCES.has(entrySource)) {
          markWelcomeAsSeen(entrySource, userId);
        }

        // Call any additional completion logic
        options.onComplete?.();
      },
    }
  );
};

/**
 * Show a model popup highlight (specific to model selector)
 */
export const showModelHighlight = (
  elementId: string,
  titleText: string,
  descriptionText: string,
  buttonText: string,
  userId?: string
): Driver | null => {
  return showElementHighlight(
    [
      {
        elementId,
        title: titleText,
        description: descriptionText,
        side: "bottom",
        align: "start",
      },
    ],
    {
      featureId: "model-selector",
      buttonText,
      userId,
      trackMetric: true,
    }
  );
};

export const hasUserSeenHighlight = (userId: string): boolean =>
  hasUserSeenFeature("model-selector", userId);

export const markHighlightAsSeen = (userId: string): void =>
  markFeatureAsSeen("model-selector", userId);

export const resetModelHighlight = (userId?: string): void =>
  resetFeatureHighlight("model-selector", userId);

// Dev utilities
if (process.env.NODE_ENV === "development") {
  (window as any).resetFeatureHighlight = resetFeatureHighlight;
  (window as any).getSourceConfig = getSourceConfig;
  (window as any).getAllSourceConfigs = (t?: TFunction) =>
    buildSourceConfigs(t);
  (window as any).REGISTERED_SOURCE_CONFIGS = REGISTERED_SOURCE_CONFIGS;
  (window as any).cleanupDriver = cleanupDriver;

  (window as any).showUnifiedSourceIntegrationPopup =
    showUnifiedSourceIntegrationPopup;
}

export default {
  showElementHighlight,
  showUnifiedSourceIntegrationPopup,
  showModelHighlight,

  hasUserSeenFeature,
  markFeatureAsSeen,
  hasUserSeenWelcome,
  markWelcomeAsSeen,
  shouldShowWelcomePopup,
  hasUserSeenPrompt,
  markPromptAsSeen,
  resetFeatureHighlight,

  getSourceConfig,
  registerSourceConfig,
  getPromptForSource,

  cleanupDriver,
};
