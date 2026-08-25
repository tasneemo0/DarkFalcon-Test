'use client';

import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  target: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  enabled?: boolean;
}

export function useCountUp({
  target,
  duration = 1400,
  delay = 0,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) { setValue(target); return; }
    }
    const runAnimation = () => {
      startedRef.current = false;
      const animate = (timestamp: number) => {
        if (!startedRef.current) { startTimeRef.current = timestamp; startedRef.current = true; }
        const elapsed = timestamp - (startTimeRef.current ?? timestamp);
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(parseFloat((eased * target).toFixed(decimals)));
        if (progress < 1) { frameRef.current = requestAnimationFrame(animate); }
        else { setValue(target); }
      };
      frameRef.current = requestAnimationFrame(animate);
    };
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (delay > 0) { timeoutId = setTimeout(runAnimation, delay); }
    else { runAnimation(); }
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [target, duration, delay, decimals, enabled]);

  return value;
}
