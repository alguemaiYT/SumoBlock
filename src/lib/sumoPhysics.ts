// ============================================
// SumoBlocks — Physics engine for the simulator
// ============================================
import {
  type SumoRobotConfig,
  type RobotState,
  type SimState,
  DOHYO_RADIUS,
  BORDER_WIDTH,
} from '@/types/sumosim';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ── Differential-drive kinematics ─────────────────────────────────────

/** Wheel base = distance between the two rear wheels */
function wheelBase(cfg: SumoRobotConfig): number {
  return Math.abs(cfg.rightWheel.offsetX - cfg.leftWheel.offsetX);
}

/**
 * Given left/right wheel speeds (arena-units/tick), compute the new
 * position and heading via differential-drive model.
 */
function differentialDrive(
  state: RobotState,
  leftSpeed: number,
  rightSpeed: number,
  wb: number,
): { x: number; y: number; rotation: number } {
  const rad = state.rotation * DEG2RAD;

  if (Math.abs(leftSpeed - rightSpeed) < 0.001) {
    // Straight line
    const d = (leftSpeed + rightSpeed) / 2;
    return {
      x: state.x + Math.sin(rad) * d,
      y: state.y - Math.cos(rad) * d,
      rotation: state.rotation,
    };
  }

  const R = (wb / 2) * (leftSpeed + rightSpeed) / (rightSpeed - leftSpeed);
  const omega = (rightSpeed - leftSpeed) / wb; // rad/tick

  const iccX = state.x - R * Math.cos(rad);
  const iccY = state.y - R * Math.sin(rad);

  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);

  return {
    x: cosO * (state.x - iccX) - sinO * (state.y - iccY) + iccX,
    y: sinO * (state.x - iccX) + cosO * (state.y - iccY) + iccY,
    rotation: state.rotation + omega * RAD2DEG,
  };
}

// ── Collision helpers ─────────────────────────────────────────────────

/** Get the 4 corners of a robot (wedge body approximated as rectangle) */
export function getRobotCorners(cfg: SumoRobotConfig, state: RobotState): [number, number][] {
  const hw = cfg.width / 2;
  const hl = cfg.length / 2;
  const rad = state.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners: [number, number][] = [
    [-hw, -hl - cfg.bladeOverhang], // front-left
    [hw, -hl - cfg.bladeOverhang],  // front-right
    [hw, hl],                        // rear-right
    [-hw, hl],                       // rear-left
  ];

  return corners.map(([lx, ly]) => [
    state.x + lx * cos - ly * sin,
    state.y + lx * sin + ly * cos,
  ]);
}

/** SAT collision test between two convex polygons */
function getAxes(corners: [number, number][]): [number, number][] {
  const axes: [number, number][] = [];
  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    const ex = corners[j][0] - corners[i][0];
    const ey = corners[j][1] - corners[i][1];
    const len = Math.sqrt(ex * ex + ey * ey);
    if (len > 0) axes.push([-ey / len, ex / len]);
  }
  return axes;
}

function project(corners: [number, number][], axis: [number, number]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, y] of corners) {
    const p = x * axis[0] + y * axis[1];
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return [min, max];
}

export function satCollision(
  cornersA: [number, number][],
  cornersB: [number, number][],
): { colliding: boolean; overlap: number; axis: [number, number] } {
  const axes = [...getAxes(cornersA), ...getAxes(cornersB)];
  let minOverlap = Infinity;
  let minAxis: [number, number] = [0, 0];

  for (const axis of axes) {
    const [minA, maxA] = project(cornersA, axis);
    const [minB, maxB] = project(cornersB, axis);
    const overlap = Math.min(maxA - minB, maxB - minA);
    if (overlap <= 0) return { colliding: false, overlap: 0, axis: [0, 0] };
    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  return { colliding: true, overlap: minOverlap, axis: minAxis };
}

// ── Sensor ray casting ────────────────────────────────────────────────

/** Cast a ray from origin in a direction, return distance to target rect or Infinity */
export function raycastToRobot(
  ox: number,
  oy: number,
  dirX: number,
  dirY: number,
  maxRange: number,
  targetCorners: [number, number][],
): number {
  let closest = maxRange;

  for (let i = 0; i < targetCorners.length; i++) {
    const j = (i + 1) % targetCorners.length;
    const [x1, y1] = targetCorners[i];
    const [x2, y2] = targetCorners[j];

    const ex = x2 - x1;
    const ey = y2 - y1;
    const denom = dirX * ey - dirY * ex;
    if (Math.abs(denom) < 1e-10) continue;

    const t = ((x1 - ox) * ey - (y1 - oy) * ex) / denom;
    const u = ((x1 - ox) * dirY - (y1 - oy) * dirX) / denom;

    if (t >= 0 && t < closest && u >= 0 && u <= 1) {
      closest = t;
    }
  }

  return closest;
}

// ── Line sensor check ─────────────────────────────────────────────────

export function isOnWhiteBorder(wx: number, wy: number): boolean {
  const dist = Math.sqrt(wx * wx + wy * wy);
  return dist >= DOHYO_RADIUS - BORDER_WIDTH;
}

export function lineSensorWorldPos(
  cfg: SumoRobotConfig,
  state: RobotState,
  offsetX: number,
  offsetY: number,
): [number, number] {
  const rad = state.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    state.x + offsetX * cos - offsetY * sin,
    state.y + offsetX * sin + offsetY * cos,
  ];
}

// ── Proximity sensor world direction ──────────────────────────────────

export function proximitySensorRay(
  cfg: SumoRobotConfig,
  state: RobotState,
  sensorAngle: number,
  sensorPosition: string,
  sensorOffsetX: number = 0,
  sensorOffsetY: number = 0,
): { ox: number; oy: number; dx: number; dy: number } {
  const rad = state.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = cfg.width / 2;
  const hl = cfg.length / 2;

  // Base position from sensor slot
  let lx = 0;
  let ly = 0;
  if (sensorPosition === 'front-left') { lx = -hw; ly = -hl - cfg.bladeOverhang; }
  else if (sensorPosition === 'front-right') { lx = hw; ly = -hl - cfg.bladeOverhang; }
  else if (sensorPosition === 'left') { lx = -hw; ly = 0; }
  else if (sensorPosition === 'right') { lx = hw; ly = 0; }

  // Apply user offsets
  lx += sensorOffsetX;
  ly += sensorOffsetY;

  const ox = state.x + lx * cos - ly * sin;
  const oy = state.y + lx * sin + ly * cos;

  const absAngle = (state.rotation + sensorAngle) * DEG2RAD;
  const dx = Math.sin(absAngle);
  const dy = -Math.cos(absAngle);

  return { ox, oy, dx, dy };
}

// ── Main simulation step ──────────────────────────────────────────────

const TICK_MS = 16;
const BASE_SPEED = 0.8;
const ROTATION_SPEED = 3;
const FRICTION = 0.92;
const PUSH_FORCE = 0.4;

export { TICK_MS };

export function stepSimulation(
  prev: SimState,
  robotCfg: SumoRobotConfig,
  opponentCfg: SumoRobotConfig,
): SimState {
  if (prev.status !== 'running') return prev;

  const r: RobotState = { ...prev.robot };
  const o: RobotState = { ...prev.opponent };
  const robotReadings: Record<string, number | boolean> = {};
  const opponentReadings: Record<string, number | boolean> = {};

  // ── Read proximity sensors and decide wheel speeds ──────────────
  const opponentCorners = getRobotCorners(opponentCfg, o);
  const robotCorners = getRobotCorners(robotCfg, r);

  // Robot AI: simple chase - both wheels full speed forward
  let rLeftSpeed = BASE_SPEED;
  let rRightSpeed = BASE_SPEED;

  // Check robot proximity sensors
  for (const sensor of robotCfg.proximitySensors) {
    if (!sensor.enabled) continue;
    const ray = proximitySensorRay(robotCfg, r, sensor.angle, sensor.position, sensor.offsetX, sensor.offsetY);
    const dist = raycastToRobot(ray.ox, ray.oy, ray.dx, ray.dy, sensor.range, opponentCorners);
    robotReadings[sensor.id] = dist;

    // Steer toward detected opponent
    if (dist < sensor.range) {
      if (sensor.position === 'front-left') rLeftSpeed *= 0.6;
      if (sensor.position === 'front-right') rRightSpeed *= 0.6;
      if (sensor.position === 'left') { rLeftSpeed = -BASE_SPEED * 0.5; rRightSpeed = BASE_SPEED; }
      if (sensor.position === 'right') { rLeftSpeed = BASE_SPEED; rRightSpeed = -BASE_SPEED * 0.5; }
    }
  }

  // Check robot line sensors
  for (const ls of robotCfg.lineSensors) {
    if (!ls.enabled) continue;
    const [wx, wy] = lineSensorWorldPos(robotCfg, r, ls.offsetX, ls.offsetY);
    const onBorder = isOnWhiteBorder(wx, wy);
    robotReadings[ls.id] = onBorder;
    if (onBorder) {
      // Reverse and turn away from border
      if (ls.offsetY < 0) {
        // Front sensor triggered - reverse
        rLeftSpeed = -BASE_SPEED;
        rRightSpeed = -BASE_SPEED * 0.5;
      } else {
        // Rear sensor triggered - go forward and turn
        rLeftSpeed = BASE_SPEED;
        rRightSpeed = BASE_SPEED * 0.5;
      }
    }
  }

  // Opponent AI: chase the robot
  const dx = r.x - o.x;
  const dy = r.y - o.y;
  const targetAngle = Math.atan2(dx, -dy) * RAD2DEG;
  let angleDiff = targetAngle - o.rotation;
  while (angleDiff > 180) angleDiff -= 360;
  while (angleDiff < -180) angleDiff += 360;

  let oLeftSpeed = BASE_SPEED * 0.85;
  let oRightSpeed = BASE_SPEED * 0.85;

  if (angleDiff > 5) {
    oLeftSpeed = BASE_SPEED * 0.85;
    oRightSpeed = BASE_SPEED * 0.3;
  } else if (angleDiff < -5) {
    oLeftSpeed = BASE_SPEED * 0.3;
    oRightSpeed = BASE_SPEED * 0.85;
  }

  // Check opponent line sensors
  for (const ls of opponentCfg.lineSensors) {
    if (!ls.enabled) continue;
    const [wx, wy] = lineSensorWorldPos(opponentCfg, o, ls.offsetX, ls.offsetY);
    const onBorder = isOnWhiteBorder(wx, wy);
    opponentReadings[ls.id] = onBorder;
    if (onBorder) {
      if (ls.offsetY < 0) {
        oLeftSpeed = -BASE_SPEED * 0.85;
        oRightSpeed = -BASE_SPEED * 0.5;
      } else {
        oLeftSpeed = BASE_SPEED * 0.85;
        oRightSpeed = BASE_SPEED * 0.5;
      }
    }
  }

  // ── Apply differential drive ────────────────────────────────────
  const rWb = wheelBase(robotCfg);
  const oWb = wheelBase(opponentCfg);

  r.leftWheelSpeed = rLeftSpeed;
  r.rightWheelSpeed = rRightSpeed;
  o.leftWheelSpeed = oLeftSpeed;
  o.rightWheelSpeed = oRightSpeed;

  const rNew = differentialDrive(r, rLeftSpeed, rRightSpeed, rWb);
  const oNew = differentialDrive(o, oLeftSpeed, oRightSpeed, oWb);

  r.x = rNew.x;
  r.y = rNew.y;
  r.rotation = rNew.rotation;
  o.x = oNew.x;
  o.y = oNew.y;
  o.rotation = oNew.rotation;

  // ── Collision detection & response ──────────────────────────────
  const rCornersNew = getRobotCorners(robotCfg, r);
  const oCornersNew = getRobotCorners(opponentCfg, o);
  const col = satCollision(rCornersNew, oCornersNew);

  if (col.colliding) {
    // Determine push direction: from center of one to center of other
    const cx = r.x - o.x;
    const cy = r.y - o.y;
    const dist = Math.sqrt(cx * cx + cy * cy) || 1;
    const nx = cx / dist;
    const ny = cy / dist;

    // Mass ratio determines who gets pushed more
    const totalMass = robotCfg.mass + opponentCfg.mass;
    const rFactor = opponentCfg.mass / totalMass;
    const oFactor = robotCfg.mass / totalMass;

    // Wedge advantage: lower wedge angle lifts opponent
    const rWedgeBonus = robotCfg.wedgeAngle > opponentCfg.wedgeAngle ? 0.15 : 0;
    const oWedgeBonus = opponentCfg.wedgeAngle > robotCfg.wedgeAngle ? 0.15 : 0;

    const pushMag = col.overlap * PUSH_FORCE;
    r.x += nx * pushMag * (rFactor + rWedgeBonus);
    r.y += ny * pushMag * (rFactor + rWedgeBonus);
    o.x -= nx * pushMag * (oFactor + oWedgeBonus);
    o.y -= ny * pushMag * (oFactor + oWedgeBonus);
  }

  // ── Check out-of-arena ──────────────────────────────────────────
  const rDist = Math.sqrt(r.x * r.x + r.y * r.y);
  const oDist = Math.sqrt(o.x * o.x + o.y * o.y);
  const arenaLimit = DOHYO_RADIUS - 2;

  if (rDist > arenaLimit || oDist > arenaLimit) {
    const rOut = rDist > arenaLimit;
    const oOut = oDist > arenaLimit;

    return {
      ...prev,
      status: 'finished',
      robot: r,
      opponent: o,
      elapsed: prev.elapsed + TICK_MS,
      winner: rOut && oOut ? 'draw' : rOut ? 'opponent' : 'robot',
      robotSensorReadings: robotReadings,
      opponentSensorReadings: opponentReadings,
    };
  }

  return {
    ...prev,
    robot: r,
    opponent: o,
    elapsed: prev.elapsed + TICK_MS,
    robotSensorReadings: robotReadings,
    opponentSensorReadings: opponentReadings,
  };
}
