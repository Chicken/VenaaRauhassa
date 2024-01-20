import { useEffect, useState } from "react";

export function useStickyState<V>(key: string, defaultValue: V) {
  const [state, setState] = useState<V>(() => {
    const stickyValue = global.window ? window.localStorage.getItem("sticky-state-" + key) : null;
    return stickyValue !== null ? (JSON.parse(stickyValue) as V) : defaultValue;
  });

  useEffect(() => {
    if (window) window.localStorage.setItem("sticky-state-" + key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
