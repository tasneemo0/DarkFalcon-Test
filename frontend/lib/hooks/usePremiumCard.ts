'use client';

import { useRef, useCallback, useState } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';

interface PremiumCardReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  glowX: MotionValue<string>;
  glowY: MotionValue<string>;
  isHovered: boolean;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SPRING_CONFIG = { stiffness: 400, damping: 30, mass: 0.5 };

export function usePremiumCard(maxTilt = 8): PremiumCardReturn {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const glowXRaw = useMotionValue('50%');
  const glowYRaw = useMotionValue('50%');

  const rotateX = useSpring(rotateXRaw, SPRING_CONFIG);
  const rotateY = useSpring(rotateYRaw, SPRING_CONFIG);
  const glowX = useSpring(glowXRaw, SPRING_CONFIG) as MotionValue<string>;
  const glowY = useSpring(glowYRaw, SPRING_CONFIG) as MotionValue<string>;

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Tilt: divide by half-dimensions, multiply by max degrees
    const tiltX = -(mouseY / (rect.height / 2)) * maxTilt;
    const tiltY = (mouseX / (rect.width / 2)) * maxTilt;

    rotateXRaw.set(tiltX);
    rotateYRaw.set(tiltY);

    // Glow spotlight position as percentage
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;
    glowXRaw.set(`${pctX}%`);
    glowYRaw.set(`${pctY}%`);
  }, [maxTilt, rotateXRaw, rotateYRaw, glowXRaw, glowYRaw]);

  const onMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glowXRaw.set('50%');
    glowYRaw.set('50%');
  }, [rotateXRaw, rotateYRaw, glowXRaw, glowYRaw]);

  return {
    cardRef,
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}
