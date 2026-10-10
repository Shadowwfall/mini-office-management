import React, { useState, useRef, useEffect } from 'react';

/**
 * AccordionSelect component powered by transitions.dev ("Accordion expand")
 * A dropdown filter with animated height (grid-template-rows: 0fr ↔ 1fr) and scaleY(-1) chevron flip.
 */
export default function AccordionSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayTitle = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="t-acc t-acc-select"
      data-open={String(isOpen)}
    >
      <button
        type="button"
        className="t-acc-head"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="t-acc-select-label">{displayTitle}</span>
        <span className="t-acc-chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M4 6.5L8 10.5L12 6.5" />
          </svg>
        </span>
      </button>

      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <div className="t-acc-options-list">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`t-acc-option-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <span className="t-acc-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
