'use client';

import React, { useRef, useEffect } from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number | string;
  delay?: number; // Delay in seconds (e.g., 0.1)
  className?: string;
  style?: React.CSSProperties;
}

function updateNodeText(
  node: HTMLSpanElement | null, 
  latest: number, 
  parsed: any
) {
  if (!node || !parsed) return;
  const { targetNum, prefix, suffix, isDecimal, decimalPlaces, hasCommas } = parsed;
  const isComplete = Math.abs(latest - targetNum) < 0.01;
  const valToFormat = isComplete ? targetNum : latest;
  let displayNum = isDecimal ? valToFormat.toFixed(decimalPlaces) : Math.round(valToFormat).toString();
  if (hasCommas) {
    const parts = displayNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    displayNum = parts.join('.');
  }
  node.textContent = `${prefix}${displayNum}${suffix}`;
}

export function AnimatedNumber({ value, delay = 0, className = '', style }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  
  // Create a spring to power the animation.
  // Values are tuned for a premium, snappy ease-out feel.
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 18,
    mass: 0.8,
    restDelta: 0.001
  });

  const prevParsed = useRef<{
    targetNum: number;
    prefix: string;
    suffix: string;
    isDecimal: boolean;
    decimalPlaces: number;
    hasCommas: boolean;
  } | null>(null);

  // When value changes or comes into view, parse and set target
  useEffect(() => {
    const strVal = String(value);
    
    if (strVal.trim() === '∞') {
      if (ref.current) ref.current.textContent = '∞';
      return;
    }

    // Match numbers with possible decimals, commas, and negative signs
    const match = strVal.match(/([-+]?[0-9][0-9,]*\.?[0-9]*)/);
    if (!match) {
      if (ref.current) ref.current.textContent = strVal;
      return;
    }

    const numStr = match[1];
    const targetNum = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(targetNum)) {
      if (ref.current) ref.current.textContent = strVal;
      return;
    }

    const prefix = strVal.substring(0, match.index);
    const suffix = strVal.substring(match.index! + numStr.length);
    const isDecimal = numStr.includes('.');
    const decimalPlaces = isDecimal ? numStr.split('.')[1].length : 0;
    const hasCommas = numStr.includes(',');

    prevParsed.current = { targetNum, prefix, suffix, isDecimal, decimalPlaces, hasCommas };
    
    // Immediately set the text so it isn't blank before the animation starts (or if target is 0)
    updateNodeText(ref.current, motionValue.get(), prevParsed.current);

    // Trigger animation if in view
    if (isInView) {
      if (shouldReduceMotion) {
        motionValue.jump(targetNum);
      } else {
        if (delay > 0) {
          setTimeout(() => {
            motionValue.set(targetNum);
          }, delay * 1000);
        } else {
          motionValue.set(targetNum);
        }
      }
    }
  }, [value, isInView, delay, motionValue, shouldReduceMotion]);

  // Update DOM directly for maximum performance (avoids React re-renders)
  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      updateNodeText(ref.current, latest, prevParsed.current);
    });
    
    return () => unsubscribe();
  }, [springValue]);

  return (
    <span ref={ref} className={className} style={style} />
  );
}
