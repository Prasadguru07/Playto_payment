import { useEffect, useRef } from "react";

/**
 * @param {() => void} callback
 * @param {number} intervalMs
 * @param {boolean} [enabled]
 */
export function usePolling(callback, intervalMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      try {
        saved.current();
      } catch {
        /* no-op: caller handles errors in callback */
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
