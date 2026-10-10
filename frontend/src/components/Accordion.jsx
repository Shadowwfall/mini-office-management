import React, { useState } from 'react';

/**
 * Accordion component powered by transitions.dev ("Accordion expand")
 * Animates height via grid-template-rows: 0fr ↔ 1fr with scaleY(-1) chevron flip.
 */
export default function Accordion({
  title,
  children,
  defaultOpen = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`t-acc ${className}`} data-open={String(isOpen)}>
      <button
        type="button"
        className="t-acc-head"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span className="t-acc-chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M4 6.5L8 10.5L12 6.5" />
          </svg>
        </span>
      </button>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <div style={{ padding: '0.75rem 1rem 1rem 1rem', borderTop: '1px solid var(--color-border)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
