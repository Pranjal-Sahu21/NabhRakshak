// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import * as satellite from 'satellite.js';

// ---------------------------------------------------------------------------
// Continent polygon data  [lng, lat]  — equirectangular projection
// ---------------------------------------------------------------------------
const CONTINENTS = [
  {
    name: 'North America',
    coords: [
      [-167, 72], [-141, 71], [-129, 57], [-124, 51], [-120, 36],
      [-118, 32], [-98, 26], [-85, 30], [-78, 44], [-64, 44],
      [-52, 47], [-53, 58], [-55, 66], [-63, 71], [-77, 73],
      [-98, 76], [-126, 75], [-149, 74], [-167, 72],
    ],
  },
  {
    name: 'South America',
    coords: [
      [-80, 12], [-62, 12], [-50, 5], [-35, -8], [-35, -55],
      [-65, -55], [-73, -43], [-80, -3], [-80, 12],
    ],
  },
  {
    name: 'Europe',
    coords: [
      [-10, 36], [-5, 36], [0, 38], [10, 38], [18, 35], [28, 37],
      [36, 42], [38, 44], [35, 50], [30, 62], [20, 66], [15, 70],
      [5, 72], [-5, 65], [-10, 55], [-10, 36],
    ],
  },
  {
    name: 'Africa',
    coords: [
      [-18, 16], [0, 5], [15, 0], [25, -5], [36, -12], [40, -28],
      [36, -35], [20, -35], [15, -28], [10, -5], [0, 5],
      [-5, 12], [-10, 22], [-18, 16],
    ],
  },
  {
    name: 'Asia',
    coords: [
      [38, 44], [50, 28], [60, 22], [72, 20], [80, 8], [95, 10],
      [100, 5], [108, 18], [118, 24], [132, 34], [136, 44], [140, 42],
      [135, 34], [128, 48], [136, 52], [140, 60], [140, 72], [120, 76],
      [100, 76], [80, 74], [64, 72], [50, 72], [40, 62], [38, 44],
    ],
  },
  {
    name: 'Australia',
    coords: [
      [115, -22], [128, -14], [138, -15], [148, -20], [152, -28],
      [150, -37], [138, -36], [130, -32], [122, -30], [115, -22],
    ],
  },
  {
    name: 'Greenland',
    coords: [
      [-45, 82], [-20, 82], [-18, 76], [-25, 72],
      [-45, 72], [-55, 76], [-45, 82],
    ],
  },
];

// ---------------------------------------------------------------------------
// Projection helpers
// ---------------------------------------------------------------------------
const toCanvas = (lng, lat, W, H) => ({
  x: ((lng + 180) / 360) * W,
  y: ((90 - lat) / 180) * H,
});

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
const drawGrid = (ctx, W, H) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.5;

  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    if (lat === 0) continue;
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Equator slightly brighter
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.8;
  const eqY = ((90 - 0) / 180) * H;
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(W, eqY);
  ctx.stroke();

  ctx.restore();
};

const drawLabels = (ctx, W, H) => {
  ctx.save();
  ctx.fillStyle = 'rgba(150,150,150,0.55)';
  ctx.font = '9px "SF Mono", "Fira Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  [-60, -30, 0, 30, 60].forEach((lat) => {
    const y = ((90 - lat) / 180) * H;
    const label = lat === 0 ? '0\xb0' : `${lat > 0 ? '+' : ''}${lat}\xb0`;
    ctx.fillText(label, 3, y);
  });

  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'center';
  [-120, -60, 0, 60, 120].forEach((lng) => {
    const x = ((lng + 180) / 360) * W;
    const label = lng === 0 ? '0\xb0' : `${lng > 0 ? '+' : ''}${lng}\xb0`;
    ctx.fillText(label, x, H - 2);
  });

  ctx.restore();
};

const drawContinents = (ctx, W, H) => {
  ctx.save();
  ctx.fillStyle = 'rgba(80,100,80,0.25)';
  ctx.strokeStyle = 'rgba(120,150,120,0.4)';
  ctx.lineWidth = 0.8;

  CONTINENTS.forEach(({ coords }) => {
    if (coords.length < 2) return;
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const { x, y } = toCanvas(lng, lat, W, H);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
};

const splitAtAntimeridian = (points) => {
  if (points.length === 0) return [];
  const segments = [];
  let current = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dLng = Math.abs(curr.lng - prev.lng);
    if (dLng > 180) {
      segments.push(current);
      current = [curr];
    } else {
      current.push(curr);
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
};

const drawTrackSegments = (ctx, segments, style) => {
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth || 1.5;
  ctx.setLineDash(style.dashed ? [6, 5] : []);

  segments.forEach((seg) => {
    if (seg.length < 2) return;
    ctx.beginPath();
    seg.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  ctx.restore();
};

// ---------------------------------------------------------------------------
// TLE propagation
// ---------------------------------------------------------------------------
const computeGroundTrack = (tle1, tle2, W, H) => {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const now = new Date();
    const pastPoints = [];
    const futurePoints = [];
    let currentPoint = null;

    for (let min = -45; min <= 90; min++) {
      const t = new Date(now.getTime() + min * 60 * 1000);
      const posVel = satellite.propagate(satrec, t);

      if (!posVel || !posVel.position || posVel.position === false) continue;

      const gmst = satellite.gstime(t);
      const geo = satellite.eciToGeodetic(posVel.position, gmst);
      const lng = satellite.degreesLong(geo.longitude);
      const lat = satellite.degreesLat(geo.latitude);
      const { x, y } = toCanvas(lng, lat, W, H);
      const pt = { x, y, lng, lat, min };

      if (min < 0) {
        pastPoints.push(pt);
      } else if (min === 0) {
        pastPoints.push(pt);
        currentPoint = pt;
        futurePoints.push(pt);
      } else {
        futurePoints.push(pt);
      }
    }

    return {
      pastSegments: splitAtAntimeridian(pastPoints),
      futureSegments: splitAtAntimeridian(futurePoints),
      currentPoint,
    };
  } catch (err) {
    console.error('[GroundTrackMap] TLE propagation error:', err);
    return { pastSegments: [], futureSegments: [], currentPoint: null };
  }
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CANVAS_W = 800;
const CANVAS_H = 380;

const GroundTrackMap = ({ selectedSatellite }) => {
  const canvasRef = useRef(null);
  const mapImageRef = useRef(null);
  const [hasTle, setHasTle] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load high-quality equirectangular map image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      mapImageRef.current = img;
      setMapLoaded(true);
    };
    img.src =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png';
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = CANVAS_W;
    const H = CANVAS_H;

    ctx.clearRect(0, 0, W, H);

    // Dark fallback background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Realistic map image (or fallback to polygon continents)
    if (mapImageRef.current) {
      ctx.drawImage(mapImageRef.current, 0, 0, W, H);
      // Dark overlay for contrast with track lines
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, W, H);
    } else {
      drawContinents(ctx, W, H);
    }

    drawGrid(ctx, W, H);
    drawLabels(ctx, W, H);

    const hasSat =
      selectedSatellite &&
      selectedSatellite.tle_line1 &&
      selectedSatellite.tle_line2;

    setHasTle(!!hasSat);

    if (!hasSat) {
      ctx.save();
      ctx.fillStyle = 'rgba(150,150,150,0.45)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select a satellite to view ground track', W / 2, H / 2);
      ctx.restore();
      return;
    }

    const { pastSegments, futureSegments, currentPoint } = computeGroundTrack(
      selectedSatellite.tle_line1,
      selectedSatellite.tle_line2,
      W,
      H
    );

    // Past track — dashed blue
    drawTrackSegments(ctx, pastSegments, {
      color: 'rgba(120,140,220,0.5)',
      lineWidth: 1.5,
      dashed: true,
    });

    // Future track — solid green
    drawTrackSegments(ctx, futureSegments, {
      color: 'rgba(80,200,140,0.8)',
      lineWidth: 1.8,
      dashed: false,
    });

    // Current position marker
    if (currentPoint) {
      ctx.save();

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,200,140,0.25)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();

      // Filled circle
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80,200,140,1)';
      ctx.fill();

      // White stroke
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    }
  };

  useEffect(() => {
    draw();
    const interval = setInterval(draw, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSatellite, mapLoaded]);

  const satName =
    selectedSatellite && selectedSatellite.name
      ? selectedSatellite.name
      : null;

  return (
    <div
      style={{
        position: 'relative',
        background: '#0d1117',
        border: '1px solid #2a2a2a',
        borderRadius: '6px',
        overflow: 'hidden',
        lineHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      />

      {/* Satellite name overlay */}
      {hasTle && satName && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '10px',
            color: '#e8e8e8',
            fontSize: '11px',
            fontFamily: '"SF Mono", "Fira Mono", monospace',
            letterSpacing: '0.04em',
            pointerEvents: 'none',
            lineHeight: '1',
          }}
        >
          {satName}
        </div>
      )}

      {/* Legend — bottom right */}
      {hasTle && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="24" height="6" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="3" x2="24" y2="3"
                stroke="rgba(80,200,140,0.85)"
                strokeWidth="2"
              />
            </svg>
            <span
              style={{
                color: '#666666',
                fontSize: '9px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.03em',
              }}
            >
              Future (+90 min)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="24" height="6" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="3" x2="24" y2="3"
                stroke="rgba(120,140,220,0.65)"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            </svg>
            <span
              style={{
                color: '#666666',
                fontSize: '9px',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.03em',
              }}
            >
              Past (&#8722;45 min)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundTrackMap;
