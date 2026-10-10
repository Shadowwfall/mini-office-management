import React, { useRef, useEffect } from 'react';

/**
 * SlidingTabs component powered by transitions.dev ("Tabs sliding")
 * Uses CSS motion tokens: --tabs-dur, --tabs-ease, --tabs-bar-bg, --tabs-pill-bg
 */
export default function SlidingTabs({ tabs, value, onChange }) {
  const containerRef = useRef(null);
  const pillRef = useRef(null);

  function moveTo(tabEl, animate = true) {
    const pill = pillRef.current;
    if (!pill || !tabEl) return;

    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = 'none';
      pill.style.transform = `translateX(${tabEl.offsetLeft}px)`;
      pill.style.width = `${tabEl.offsetWidth}px`;
      void pill.offsetWidth; // Force reflow
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tabEl.offsetLeft}px)`;
      pill.style.width = `${tabEl.offsetWidth}px`;
    }
  }

  // Position pill with transition whenever selected value changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeEl = container.querySelector('[aria-selected="true"]');
    if (activeEl) {
      moveTo(activeEl, true);
    }
  }, [value]);

  // Initial layout without animation (so pill snaps cleanly without transition on mount or resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeEl =
      container.querySelector('[aria-selected="true"]') ||
      container.querySelector('.t-tab');

    if (activeEl) {
      requestAnimationFrame(() => moveTo(activeEl, false));
    }

    function handleResize() {
      const currentActive =
        container.querySelector('[aria-selected="true"]') ||
        container.querySelector('.t-tab');
      if (currentActive) {
        moveTo(currentActive, false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="t-tabs" role="tablist" ref={containerRef}>
      <span className="t-tabs-pill" ref={pillRef} aria-hidden="true" />
      {tabs.map((tab) => {
        const isSelected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            className="t-tab"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
