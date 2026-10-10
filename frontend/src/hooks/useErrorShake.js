import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for Jakubantalik/transitions.dev "Error state shake" transition
 * Handles multi-segment percussive shake (.is-shaking) and error state (.is-error)
 */
export function useErrorShake() {
  const [shakingFields, setShakingFields] = useState({});
  const timeoutRef = useRef({});

  const triggerShake = useCallback((fieldNames) => {
    const list = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    // Clear existing timers for targeted fields
    list.forEach((name) => {
      if (timeoutRef.current[name]) {
        clearTimeout(timeoutRef.current[name]);
      }
    });

    // Reset shaking state first to force CSS re-trigger if already active
    setShakingFields((prev) => {
      const next = { ...prev };
      list.forEach((name) => {
        delete next[name];
      });
      return next;
    });

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      setShakingFields((prev) => {
        const next = { ...prev };
        list.forEach((name) => {
          next[name] = true;
        });
        return next;
      });

      // Remove shaking class after animation duration (280ms) + 40ms safety buffer
      list.forEach((name) => {
        timeoutRef.current[name] = setTimeout(() => {
          setShakingFields((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }, 320);
      });
    });
  }, []);

  const clearShake = useCallback((fieldName) => {
    if (timeoutRef.current[fieldName]) {
      clearTimeout(timeoutRef.current[fieldName]);
    }
    setShakingFields((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  return { shakingFields, triggerShake, clearShake };
}
