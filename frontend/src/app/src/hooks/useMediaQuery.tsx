import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  // Initialize the state synchronously using `window.matchMedia`
  const getInitialState = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Set the initial state
    setMatches(mql.matches);

    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } else {
      // Legacy Safari fallback
      // @ts-expect-error: Older Safari types
      mql.addListener(onChange);
      // @ts-expect-error: Older Safari types
      return () => mql.removeListener(onChange);
    }
  }, [query]);

  return matches;
}
