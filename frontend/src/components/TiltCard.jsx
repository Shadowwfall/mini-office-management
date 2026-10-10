import React, { useRef, useEffect } from 'react';

/**
 * TiltCard component implementing transitions.dev "3D tilt" (Card hover tilt)
 * Specs & motion tokens from: https://transitions.dev/detail.html?t=card-tilt
 *
 * Tracks pointer on the outer flat wrapper (.t-tilt) and updates CSS variables
 * (--tilt-rx, --tilt-ry, --tilt-gx, --tilt-gy) on the tilting card (.t-tilt-card).
 */
export default function TiltCard({
  children,
  className = '',
  cardClassName = '',
  maxTilt = 14,
  as: Component = 'div',
  ...rest
}) {
  const tiltRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    const card = cardRef.current;
    if (!tilt || !card) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const reset = () => {
      tilt.classList.remove('is-hover');
      card.classList.remove('is-tilting');
      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
    };

    const handlePointerDown = (e) => {
      if (e.pointerType !== 'mouse') {
        try {
          tilt.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const handlePointerMove = (e) => {
      if (mediaQuery.matches) return;
      const r = tilt.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));

      tilt.classList.add('is-hover');
      card.classList.add('is-tilting');
      card.style.setProperty('--tilt-ry', `${((px - 0.5) * maxTilt).toFixed(2)}deg`);
      card.style.setProperty('--tilt-rx', `${((0.5 - py) * maxTilt).toFixed(2)}deg`);
      card.style.setProperty('--tilt-gx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--tilt-gy', `${(py * 100).toFixed(1)}%`);
    };

    const handlePointerUp = () => reset();
    const handlePointerCancel = () => reset();
    const handlePointerLeave = (e) => {
      if (e.pointerType === 'mouse') reset();
    };

    tilt.addEventListener('pointerdown', handlePointerDown);
    tilt.addEventListener('pointermove', handlePointerMove);
    tilt.addEventListener('pointerup', handlePointerUp);
    tilt.addEventListener('pointercancel', handlePointerCancel);
    tilt.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      tilt.removeEventListener('pointerdown', handlePointerDown);
      tilt.removeEventListener('pointermove', handlePointerMove);
      tilt.removeEventListener('pointerup', handlePointerUp);
      tilt.removeEventListener('pointercancel', handlePointerCancel);
      tilt.removeEventListener('pointerleave', handlePointerLeave);
      reset();
    };
  }, [maxTilt]);

  return (
    <Component
      ref={tiltRef}
      className={`t-tilt ${className}`.trim()}
      {...rest}
    >
      <div ref={cardRef} className={`t-tilt-card ${cardClassName}`.trim()}>
        {children}
        <div className="t-tilt-glare" aria-hidden="true" />
      </div>
    </Component>
  );
}
