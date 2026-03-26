/**
 * Utility functions for Hot Module Replacement (HMR)
 */

/**
 * Register a component for HMR updates
 * @param module The module to register for HMR
 * @param callback Function to call when the module is updated
 */
export const registerForHMR = (
  module: { hot?: { accept: (callback: () => void) => void } },
  callback: () => void
) => {
  if (module.hot) {
    module.hot.accept(callback);
  }
};

/**
 * Check if HMR is available
 * @returns True if HMR is available
 */
export const isHMRAvailable = (): boolean => {
  return import.meta.hot !== undefined;
};

/**
 * Register a module for HMR updates
 * @param modulePath The path to the module to register
 * @param callback Function to call when the module is updated
 */
export const acceptHMRUpdate = (
  modulePath: string,
  callback: () => void
): void => {
  if (import.meta.hot) {
    import.meta.hot.accept(modulePath, callback);
  }
};

/**
 * Log HMR updates to the console
 * @param message The message to log
 */
export const logHMRUpdate = (message: string): void => {
  if (import.meta.env.DEV) {
    console.log(`[HMR] ${message}`);
  }
};
