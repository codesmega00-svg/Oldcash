'use client';
import { useEffect, useRef } from 'react';

export function triggerConfetti(options = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oldcash:confetti', { detail: options }));
  }
}

export default function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      '#00ffa3', // Solana Green
      '#dc1fff', // Solana Purple
      '#00e5ff', // Cyber Cyan
      '#ffb703', // Matrix Gold
      '#ec4899', // Old Cash Pink
      '#38bdf8', // Neon Sky
      '#ffffff', // Sparkle White
    ];

    const spawnConfetti = (e) => {
      const count = e?.detail?.count || 80;
      const originX = e?.detail?.x ?? window.innerWidth / 2;
      const originY = e?.detail?.y ?? window.innerHeight * 0.35;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 5;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 16,
          opacity: 1,
          gravity: 0.28,
          drag: 0.965,
          shape: Math.random() > 0.4 ? 'rect' : 'circle',
        });
      }
    };

    window.addEventListener('oldcash:confetti', spawnConfetti);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (particles.length > 0) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.rotation += p.vRot;
          p.opacity -= 0.012;

          if (p.opacity <= 0 || p.y > canvas.height + 25) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          }
          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('oldcash:confetti', spawnConfetti);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}
