'use client';
import { useEffect, useState, useRef } from 'react';

const THEMES = [
  { id: 'pink', name: 'Arbio Pink', icon: '🌸', desc: 'Classic Retro OS' },
  { id: 'light-video', name: 'Light Video', icon: '☀️', desc: 'Luminous Video OS' },
  { id: 'matrix5', name: 'ASCII Golden', icon: '✨', desc: 'Bright Gold Video' },
  { id: 'cyber', name: 'Cyber Matrix', icon: '⚡', desc: 'Bright Cyan Video' },
  { id: 'sunset', name: 'Sunset Pixel', icon: '🌅', desc: 'Red Sun Mountains' },
  { id: 'dark', name: 'Obsidian Dark', icon: '🌑', desc: 'Clean Terminal' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState('pink');
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('oldcash-theme');
    if (saved && ['pink', 'light-video', 'sunset', 'cyber', 'matrix5', 'dark', 'light'].includes(saved)) {
      const normalized = saved === 'light' ? 'pink' : saved;
      setTheme(normalized);
      document.documentElement.setAttribute('data-theme', normalized);
    } else {
      const current = document.documentElement.getAttribute('data-theme') || 'pink';
      setTheme(current === 'light' ? 'pink' : current);
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('oldcash-theme', newTheme);
    } catch {}
    setMenuOpen(false);
  };

  const cycleTheme = (e) => {
    // If clicking the icon or label directly (not dropdown arrow), cycle next
    e.stopPropagation();
    const currentIdx = THEMES.findIndex((t) => t.id === theme);
    const nextIdx = (currentIdx + 1) % THEMES.length;
    selectTheme(THEMES[nextIdx].id);
  };

  const activeThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="theme-switcher-container" ref={menuRef}>
      <div className="theme-toggle-cluster">
        {/* Main button cycles quickly */}
        <button
          className="theme-toggle-btn"
          type="button"
          onClick={cycleTheme}
          title={`Active: ${activeThemeObj.name}. Click to cycle themes.`}
          aria-label="Cycle theme"
        >
          <span className="theme-toggle-icon">{mounted ? activeThemeObj.icon : '🌸'}</span>
          <span className="theme-toggle-label">{mounted ? activeThemeObj.name : 'Theme'}</span>
        </button>

        {/* Dropdown chevron to pick directly */}
        <button
          className="theme-toggle-arrow"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          title="Choose theme menu"
          aria-label="Open theme options"
        >
          ▾
        </button>
      </div>

      {menuOpen && (
        <div className="theme-dropdown-menu">
          <div className="theme-dropdown-header">
            <span>SELECT THEME</span>
            <span className="theme-dropdown-hint">[6 MODES]</span>
          </div>
          {THEMES.map((t) => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                className={`theme-dropdown-item ${isActive ? 'theme-dropdown-item--active' : ''}`}
                onClick={() => selectTheme(t.id)}
              >
                <span className="theme-item-icon">{t.icon}</span>
                <div className="theme-item-info">
                  <span className="theme-item-name">{t.name}</span>
                  <span className="theme-item-desc">{t.desc}</span>
                </div>
                {isActive && <span className="theme-item-active-tick">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
