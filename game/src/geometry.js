// MIDNIGHT VAULT — geometry helpers.
// One clear job: collision and line-of-sight tests the guards and cameras share.

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle r?
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  return (
    segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y)
  );
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = cross(dx - cx, dy - cy, ax - cx, ay - cy);
  const d2 = cross(dx - cx, dy - cy, bx - cx, by - cy);
  const d3 = cross(bx - ax, by - ay, cx - ax, cy - ay);
  const d4 = cross(bx - ax, by - ay, dx - ax, dy - ay);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

// Is the view from (x1,y1) to (x2,y2) blocked by any solid rect, or any smoke cloud?
export function lineOfSightBlocked(x1, y1, x2, y2, solids, smokes) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  for (const s of smokes) {
    if (segmentHitsCircle(x1, y1, x2, y2, s.x, s.y, s.r)) return true;
  }
  return false;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy < r * r;
}

// Push a circle out of every solid rect it overlaps; returns true if it hit anything.
export function resolveCircleVsRects(circle, solids) {
  let hit = false;
  for (const r of solids) {
    const cx = Math.max(r.x, Math.min(circle.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(circle.y, r.y + r.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < circle.r * circle.r) {
      hit = true;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        circle.x = cx + (dx / d) * circle.r;
        circle.y = cy + (dy / d) * circle.r;
      } else {
        // Centre inside the rect: push out along the smallest exit.
        const left = circle.x - r.x;
        const right = r.x + r.w - circle.x;
        const top = circle.y - r.y;
        const bottom = r.y + r.h - circle.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) circle.x = r.x - circle.r;
        else if (m === right) circle.x = r.x + r.w + circle.r;
        else if (m === top) circle.y = r.y - circle.r;
        else circle.y = r.y + r.h + circle.r;
      }
    }
  }
  return hit;
}

// Keep a circle inside the floor rectangle.
export function clampCircleToFloor(circle, floor) {
  circle.x = Math.max(floor.x + circle.r, Math.min(floor.x + floor.w - circle.r, circle.x));
  circle.y = Math.max(floor.y + circle.r, Math.min(floor.y + floor.h - circle.r, circle.y));
}
