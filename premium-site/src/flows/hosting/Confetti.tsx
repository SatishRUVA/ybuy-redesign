import { useEffect, useRef } from 'react';

/** Brand palette: forest, ink, sage, sand, soft gold. */
const COLORS = ['#24594b', '#2f7a64', '#242726', '#9cc5b4', '#e7dcc8', '#d9b15f'];
const DURATION = 2200;
const GRAVITY = 0.16;
const DRAG = 0.985;

interface Piece {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; shape: 'ribbon' | 'dot';
  rotation: number; spin: number; tilt: number; tiltSpeed: number;
}

function createPieces(originX: number, originY: number, count: number): Piece[] {
  // Near the top of the screen, flatten the arc so pieces don't fly out of view.
  const lift = Math.min(1, Math.max(0.45, originY / 380));
  return Array.from({ length: count }, () => {
    // Fan upward (-160° to -20°) so pieces arc out of the check mark, then fall.
    const angle = (-165 + Math.random() * 150) * (Math.PI / 180);
    const speed = 4.5 + Math.random() * 6.5;
    return {
      x: originX, y: originY,
      vx: Math.cos(angle) * speed * 1.15, vy: (Math.sin(angle) * speed - 1.5) * lift,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.65 ? 'ribbon' : 'dot',
      rotation: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.3,
      tilt: Math.random() * Math.PI, tiltSpeed: 0.08 + Math.random() * 0.12,
    };
  });
}

/**
 * Full-screen, non-interactive confetti burst from the centre of `originRef`.
 * Change `burst` to replay. Skipped entirely for reduced-motion users.
 */
export default function Confetti({ originRef, burst }: { originRef: React.RefObject<HTMLElement | null>; burst: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rect = originRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 3;
    const pieces = createPieces(originX, originY, window.innerWidth < 640 ? 90 : 140);
    const startedAt = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      // Fade out over the last third so pieces dissolve instead of popping away.
      const alpha = Math.max(0, Math.min(1, (DURATION - elapsed) / (DURATION / 3)));
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.globalAlpha = alpha;
      for (const piece of pieces) {
        piece.vx *= DRAG;
        piece.vy = piece.vy * DRAG + GRAVITY;
        piece.x += piece.vx + Math.sin(piece.tilt) * 0.6;
        piece.y += piece.vy;
        piece.rotation += piece.spin;
        piece.tilt += piece.tiltSpeed;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        if (piece.shape === 'dot') {
          context.beginPath();
          context.arc(0, 0, piece.size / 2.6, 0, Math.PI * 2);
          context.fill();
        } else {
          // Scaling Y by cos(tilt) fakes a ribbon flipping in 3D.
          context.scale(1, Math.cos(piece.tilt));
          context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        }
        context.restore();
      }
      if (elapsed < DURATION) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    frame = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, [burst, originRef]);

  return <canvas ref={canvasRef} className="cl-confetti" aria-hidden="true" />;
}
