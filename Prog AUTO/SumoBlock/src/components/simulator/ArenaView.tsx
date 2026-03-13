import { useRef, useEffect, useCallback } from 'react';
import type { SumoRobotConfig, SimState } from '@/types/sumosim';
import { DOHYO_RADIUS, BORDER_WIDTH } from '@/types/sumosim';
import {
  getRobotCorners,
  proximitySensorRay,
  lineSensorWorldPos,
  isOnWhiteBorder,
} from '@/lib/sumoPhysics';

interface ArenaViewProps {
  robotCfg: SumoRobotConfig;
  opponentCfg: SumoRobotConfig;
  simState: SimState;
}

export function ArenaView({ robotCfg, opponentCfg, simState }: ArenaViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(rect.width, rect.height);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Transform so arena center is at canvas center
    const scale = (size * 0.9) / (DOHYO_RADIUS * 2 + 20);
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // ── Draw arena ────────────────────────────────────────────────
    // Outer shadow
    ctx.beginPath();
    ctx.arc(0, 0, DOHYO_RADIUS + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Black playing surface
    ctx.beginPath();
    ctx.arc(0, 0, DOHYO_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White border (tawara)
    ctx.beginPath();
    ctx.arc(0, 0, DOHYO_RADIUS - BORDER_WIDTH / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = BORDER_WIDTH;
    ctx.stroke();

    // Shikiri lines (center starting marks)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // ── Draw robots ───────────────────────────────────────────────
    drawRobot(ctx, robotCfg, simState.robot, true);
    drawRobot(ctx, opponentCfg, simState.opponent, false);

    ctx.restore();
  }, [robotCfg, opponentCfg, simState]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="rounded-xl" />
    </div>
  );
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  cfg: SumoRobotConfig,
  state: { x: number; y: number; rotation: number },
  showSensors: boolean,
) {
  const hw = cfg.width / 2;
  const hl = cfg.length / 2;
  const rad = (state.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate(rad);

  // ── Wheels (rear, differential) ─────────────────────────────
  ctx.fillStyle = '#333';
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 0.5;

  // Left wheel
  const lw = cfg.leftWheel;
  ctx.fillRect(lw.offsetX - lw.width, lw.offsetY - lw.radius, lw.width * 2, lw.radius * 2);
  ctx.strokeRect(lw.offsetX - lw.width, lw.offsetY - lw.radius, lw.width * 2, lw.radius * 2);

  // Right wheel
  const rw = cfg.rightWheel;
  ctx.fillRect(rw.offsetX - rw.width, rw.offsetY - rw.radius, rw.width * 2, rw.radius * 2);
  ctx.strokeRect(rw.offsetX - rw.width, rw.offsetY - rw.radius, rw.width * 2, rw.radius * 2);

  // ── Chassis (wedge shape) ───────────────────────────────────
  const bladeY = -hl - cfg.bladeOverhang;
  const wedgeInset = cfg.wedgeAngle * 0.2; // visual wedge narrowing at front

  ctx.beginPath();
  ctx.moveTo(-hw + wedgeInset, bladeY);       // front-left
  ctx.lineTo(hw - wedgeInset, bladeY);        // front-right
  ctx.lineTo(hw, hl);                          // rear-right
  ctx.lineTo(-hw, hl);                         // rear-left
  ctx.closePath();
  ctx.fillStyle = cfg.color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Blade (front edge) ──────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(-hw - 1, bladeY);
  ctx.lineTo(hw + 1, bladeY);
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Direction arrow ─────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(0, bladeY - 4);
  ctx.lineTo(-4, bladeY + 2);
  ctx.lineTo(4, bladeY + 2);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Name label ──────────────────────────────────────────────
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.name.slice(0, 4).toUpperCase(), 0, 2);

  ctx.restore();

  // ── Proximity sensors (drawn in world space) ────────────────
  if (showSensors) {
    for (const sensor of cfg.proximitySensors) {
      if (!sensor.enabled) continue;
      const ray = proximitySensorRay(cfg, { ...state, vx: 0, vy: 0, angularVelocity: 0, leftWheelSpeed: 0, rightWheelSpeed: 0 }, sensor.angle, sensor.position, sensor.offsetX, sensor.offsetY);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ray.ox, ray.oy);
      ctx.lineTo(ray.ox + ray.dx * sensor.range, ray.oy + ray.dy * sensor.range);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Sensor dot
      ctx.beginPath();
      ctx.arc(ray.ox, ray.oy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.restore();
    }

    // ── Line sensors (small dots on ground) ───────────────────
    for (const ls of cfg.lineSensors) {
      if (!ls.enabled) continue;
      const [wx, wy] = lineSensorWorldPos(
        cfg,
        { ...state, vx: 0, vy: 0, angularVelocity: 0, leftWheelSpeed: 0, rightWheelSpeed: 0 },
        ls.offsetX,
        ls.offsetY,
      );
      const triggered = isOnWhiteBorder(wx, wy);
      ctx.save();
      ctx.beginPath();
      ctx.arc(wx, wy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = triggered ? '#ef4444' : '#4ade80';
      ctx.fill();
      ctx.restore();
    }
  }
}
