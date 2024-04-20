import { useEffect, useState } from "react";

export function useStickyState<V>(key: string, defaultValue: V) {
  const [state, setState] = useState<V>(() => {
    const stickyValue = global.window ? window.localStorage.getItem("sticky-state-" + key) : null;
    return stickyValue !== null ? (JSON.parse(stickyValue) as V) : defaultValue;
  });

  useEffect(() => {
    if (window) window.localStorage.setItem("sticky-state-" + key, JSON.stringify(state));
  }, [key, state]);

  useEffect(() => {
    if (global.window) {
      const oldDefault = window.localStorage.getItem("sticky-state-default-" + key);
      if (oldDefault !== JSON.stringify(defaultValue)) {
        window.localStorage.setItem("sticky-state-default-" + key, JSON.stringify(defaultValue));
        setState(defaultValue);
      }
    }
  }, [key, defaultValue]);

  return [state, setState] as const;
}
