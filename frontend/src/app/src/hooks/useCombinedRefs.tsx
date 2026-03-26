import { RefCallback, RefObject, MutableRefObject } from "react";

function useCombinedRefs<T>(
  ...refs: (RefCallback<T> | RefObject<T> | null | undefined)[]
): RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (ref == null) {
        return; // Skip null or undefined refs
      }

      if (typeof ref === "function") {
        ref(node); // Call the function ref with the node
      } else if ("current" in ref) {
        // Safe to assume ref is a RefObject
        (ref as MutableRefObject<T | null>).current = node; // Cast to MutableRefObject
      }
    });
  };
}

export default useCombinedRefs;
