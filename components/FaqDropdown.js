'use client';
import { useState } from 'react';

export default function FaqDropdown({ items = [] }) {
  // Set first item open by default for immediate preview
  const [openIndices, setOpenIndices] = useState(new Set([0]));

  const toggleIndex = (idx) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIndices(new Set(items.map((_, i) => i)));
  };

  const collapseAll = () => {
    setOpenIndices(new Set());
  };

  return (
    <div className="faq-dropdown-container">
      <div className="faq-controls">
        <span className="faq-count-pill">{items.length} Questions &amp; Answers</span>
        <div className="faq-toggle-buttons">
          <button type="button" className="faq-mini-btn" onClick={expandAll}>
            [+] Expand All
          </button>
          <button type="button" className="faq-mini-btn" onClick={collapseAll}>
            [−] Collapse All
          </button>
        </div>
      </div>

      <div className="faq-dropdown-list">
        {items.map((item, idx) => {
          const q = Array.isArray(item) ? item[0] : item.q;
          const a = Array.isArray(item) ? item[1] : item.a;
          const isOpen = openIndices.has(idx);

          return (
            <div
              key={idx}
              className={`faq-accordion-item ${isOpen ? 'faq-accordion-item--open' : ''}`}
            >
              <button
                type="button"
                className="faq-accordion-header"
                onClick={() => toggleIndex(idx)}
                aria-expanded={isOpen}
              >
                <div className="faq-header-left">
                  <span className="faq-num">0{idx + 1}</span>
                  <span className="faq-question-text">{q}</span>
                </div>
                <div className="faq-header-right">
                  <span className="faq-icon-badge">{isOpen ? '−' : '+'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="faq-accordion-body">
                  <div className="faq-answer-inner">{a}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
