export function animate(animateFrame: (t: number) => void, duration: number) {
  let cancelled = false;
  let start = -1;
  function frame(t: number) {
    if (cancelled) return;
    if (start === -1) start = t;
    const p = Math.min((t - start) / duration, 1);
    animateFrame(p);
    if (p < 1) window.requestAnimationFrame((time) => frame(time));
  }

  window.requestAnimationFrame((time) => frame(time));
  return () => (cancelled = true);
}

export const Easing = {
  linear: (t) => t,
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
} satisfies Record<string, (t: number) => number>;
