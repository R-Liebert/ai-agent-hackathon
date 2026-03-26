// Force refresh script - include this temporarily after deployment
// Add <script src="/force-refresh.js"></script> to index.html temporarily

(function () {
  // Use a STATIC version number that you update with each deployment
  const DEPLOYMENT_VERSION = "2024-02-06-v1"; // Change this with each deployment
  const STORAGE_KEY = "app-deployment-version";
  const SESSION_KEY = "app-refresh-attempted";

  // Don't run if we already attempted refresh in this session
  if (sessionStorage.getItem(SESSION_KEY)) {
    return;
  }

  const lastVersion = localStorage.getItem(STORAGE_KEY);
  const currentVersion = DEPLOYMENT_VERSION;

  // Force refresh if no version stored (new users with cached content) OR version is different
  if (!lastVersion || lastVersion !== currentVersion) {
    // Mark that we're attempting refresh in this session
    sessionStorage.setItem(SESSION_KEY, "true");

    // Clear all caches
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    localStorage.setItem(STORAGE_KEY, currentVersion);

    // Add small delay before reload
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  }
})();
