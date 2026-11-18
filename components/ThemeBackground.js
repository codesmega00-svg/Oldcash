'use client';
import { useEffect, useState } from 'react';

export default function ThemeBackground() {
  const [theme, setTheme] = useState('pink');
  const [mounted, setMounted] = useState(false);
  const [videoBoost, setVideoBoost] = useState(true); // Default to Extra Light / Radiant Bright

  useEffect(() => {
    setMounted(true);
    const updateTheme = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'pink';
      setTheme(current);
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  const isVideoTheme = theme === 'cyber' || theme === 'matrix5' || theme === 'light-video';

  return (
    <>
      {/* ============================================================
          CYBER MATRIX (Cyan & Emerald - Bright Luminous Video)
          ============================================================ */}
      {theme === 'cyber' && (
        <div
          className={`cyber-video-bg-wrap ${videoBoost ? 'video-bg-wrap--boosted' : ''}`}
          aria-hidden="true"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="cyber-video-bg"
            src="/assets/ascii-magic.mp4"
          />
          {/* Luminous Light Rays & Bloom */}
          <div className="video-ambient-light-bloom" />
          <div className="cyber-cosmic-glow" />
          <div className="cyber-video-tint" />
          <div className="crt-scanline-grid" />
        </div>
      )}

      {/* ============================================================
          ASCII GOLDEN MATRIX (Warm Amber & Gold - Bright Radiant Video)
          ============================================================ */}
      {theme === 'matrix5' && (
        <div
          className={`cyber-video-bg-wrap matrix5-video-bg-wrap ${
            videoBoost ? 'video-bg-wrap--boosted' : ''
          }`}
          aria-hidden="true"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="cyber-video-bg matrix5-video-bg"
            src="/assets/ascii-magic-5.mp4"
          />
          {/* Luminous Golden Light Bloom */}
          <div className="video-ambient-light-bloom video-ambient-light-bloom--gold" />
          <div className="matrix5-amber-glow" />
          <div className="matrix5-video-tint" />
          <div className="crt-scanline-grid" />
        </div>
      )}

      {/* ============================================================
          LIGHT VIDEO MODE (Arbio Pink Canvas with Luminous Video)
          ============================================================ */}
      {theme === 'light-video' && (
        <div
          className="cyber-video-bg-wrap light-video-bg-wrap video-bg-wrap--boosted"
          aria-hidden="true"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="cyber-video-bg light-mode-video-bg"
            src="/assets/ascii-magic-5.mp4"
          />
          <div className="light-video-pink-tint" />
          <div className="light-video-dot-grid" />
          <div className="crt-scanline-grid crt-scanline-grid--light" />
        </div>
      )}

      {/* ============================================================
          SUNSET AMBIENT GLOW
          ============================================================ */}
      {theme === 'sunset' && (
        <div className="sunset-ambient-glow" aria-hidden="true" />
      )}

      {/* ============================================================
          FLOATING VIDEO LIGHT TUNER (Quick 1-Click Brightness Boost)
          ============================================================ */}
      {isVideoTheme && (
        <aside className="video-light-tuner" aria-label="Video Background Light Level">
          <button
            type="button"
            className={`video-light-btn ${videoBoost ? 'video-light-btn--active' : ''}`}
            onClick={() => setVideoBoost((v) => !v)}
            title={videoBoost ? 'Video Light: RADIANT HIGH (Click to soften)' : 'Video Light: SOFT (Click to brighten)'}
          >
            <span className="video-light-icon">{videoBoost ? '☀️' : '💡'}</span>
            <span className="video-light-label">
              {videoBoost ? 'VIDEO LIGHT: MAX' : 'VIDEO LIGHT: SOFT'}
            </span>
          </button>
        </aside>
      )}
    </>
  );
}
