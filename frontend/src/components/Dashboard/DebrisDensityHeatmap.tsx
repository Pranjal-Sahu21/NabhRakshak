// @ts-nocheck
import React, { useMemo } from 'react';

const ALTITUDE_BANDS = [
  { label: 'Very Low (< 300 km)',    range: [0,     300],   kessler: false },
  { label: 'Low Earth (300–600 km)', range: [300,   600],   kessler: true  },
  { label: 'Mid LEO (600–900 km)',   range: [600,   900],   kessler: true  },
  { label: 'High LEO (900–1200 km)', range: [900,   1200],  kessler: false },
  { label: 'LEO/MEO (1200–2000 km)', range: [1200,  2000],  kessler: false },
  { label: 'MEO (2000–10000 km)',    range: [2000,  10000], kessler: false },
  { label: 'GEO (35000–36000 km)',   range: [35000, 36000], kessler: false },
  { label: 'HEO (> 36000 km)',       range: [36000, 99999], kessler: false },
];

const MOCK_DEBRIS = [12, 145, 312, 189, 67, 34, 89, 28];
const MOCK_SATS   = [3,  18,  22,  12,  8,  5,  45,  4];

const LEO_RANGE   = [300, 1200];

const DEBRIS_COLOR = 'rgba(160,100,80,0.7)';
const SAT_COLOR    = 'rgba(80,130,160,0.7)';

function extractAltitude(obj) {
  if (!obj) return null;
  if (typeof obj.altitude === 'number')     return obj.altitude;
  if (typeof obj.meanAltitude === 'number') return obj.meanAltitude;
  if (typeof obj.apogee === 'number' && typeof obj.perigee === 'number')
    return (obj.apogee + obj.perigee) / 2;
  if (typeof obj.perigee === 'number') return obj.perigee;
  if (typeof obj.apogee  === 'number') return obj.apogee;
  const raw = obj.MEAN_MOTION ?? obj.meanMotion ?? obj.mean_motion;
  if (raw) {
    const n = parseFloat(raw);
    if (n > 0) {
      const MU = 3.986004418e14;
      const RE = 6371;
      const T  = 86400 / n;
      const a  = Math.cbrt((MU * T * T) / (4 * Math.PI * Math.PI));
      return a / 1000 - RE;
    }
  }
  return null;
}

function countByBands(objects) {
  return ALTITUDE_BANDS.map(({ range }) => {
    const [lo, hi] = range;
    return objects.filter(o => {
      const alt = extractAltitude(o);
      return alt !== null && alt >= lo && alt < hi;
    }).length;
  });
}

function isLEOBand(range) {
  return range[0] >= LEO_RANGE[0] && range[1] <= LEO_RANGE[1];
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
      <span style={{ color: '#666666', fontSize: 11 }}>{label}</span>
    </div>
  );
}

function HeatmapRow({ label, dCount, sCount, dPct, sPct, isLEO, kessler, rowBg }) {
  const [hovered, setHovered] = React.useState(false);
  const bg = hovered ? '#222222' : rowBg;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 36,
        paddingLeft: isLEO ? 7 : 8,
        paddingRight: 8,
        backgroundColor: bg,
        borderLeft: isLEO ? '2px solid #7a6a50' : '2px solid transparent',
        transition: 'background-color 0.15s ease',
        cursor: 'default',
      }}
    >
      {/* Label column */}
      <div style={{ width: 180, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            color: isLEO ? '#b8a888' : '#999999',
            fontSize: 11,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        {kessler && (
          <span
            style={{
              fontSize: 9,
              color: '#7a6a50',
              border: '1px solid #7a6a50',
              borderRadius: 3,
              padding: '0 4px',
              lineHeight: '14px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            KESSLER RISK
          </span>
        )}
      </div>

      {/* Bar track */}
      <div
        style={{
          flex: 1,
          height: 16,
          backgroundColor: '#111111',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${dPct}%`,
            height: '100%',
            backgroundColor: DEBRIS_COLOR,
            transition: 'width 0.45s ease',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            width: `${sPct}%`,
            height: '100%',
            backgroundColor: SAT_COLOR,
            transition: 'width 0.45s ease',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Count label */}
      <div
        style={{
          width: 72,
          flexShrink: 0,
          textAlign: 'right',
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'rgba(160,100,80,0.9)' }}>{dCount.toLocaleString()}d</span>
        <span style={{ color: '#3a3a3a', margin: '0 3px' }}>/</span>
        <span style={{ color: 'rgba(80,130,160,0.9)' }}>{sCount.toLocaleString()}s</span>
      </div>
    </div>
  );
}

export default function DebrisDensityHeatmap({ satellites = [], debris = [] }) {
  const { debrisCounts, satCounts, useMock } = useMemo(() => {
    const hasSats   = Array.isArray(satellites) && satellites.length > 0;
    const hasDebris = Array.isArray(debris)     && debris.length     > 0;

    if (!hasSats && !hasDebris) {
      return { debrisCounts: MOCK_DEBRIS, satCounts: MOCK_SATS, useMock: true };
    }
    return {
      debrisCounts: hasDebris ? countByBands(debris)     : MOCK_DEBRIS,
      satCounts:    hasSats   ? countByBands(satellites) : MOCK_SATS,
      useMock:      false,
    };
  }, [satellites, debris]);

  const maxTotal = useMemo(
    () => Math.max(...debrisCounts.map((d, i) => d + satCounts[i]), 1),
    [debrisCounts, satCounts],
  );

  const totalObjects = useMemo(
    () => debrisCounts.reduce((s, v) => s + v, 0) + satCounts.reduce((s, v) => s + v, 0),
    [debrisCounts, satCounts],
  );

  return (
    <div
      style={{
        backgroundColor: '#1c1c1c',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        padding: '16px 20px',
        fontFamily: 'inherit',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <span style={{ color: '#e8e8e8', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em' }}>
          Orbital Density Distribution
        </span>
        <span style={{ color: '#666666', fontSize: 11 }}>
          {totalObjects.toLocaleString()} objects total
          {useMock && (
            <span
              style={{
                marginLeft: 8,
                color: '#7a6a50',
                fontSize: 10,
                border: '1px solid #7a6a50',
                borderRadius: 3,
                padding: '1px 5px',
                verticalAlign: 'middle',
              }}
            >
              MOCK
            </span>
          )}
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <LegendDot color={DEBRIS_COLOR} label="Debris" />
        <LegendDot color={SAT_COLOR}    label="Satellites" />
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        {ALTITUDE_BANDS.map(({ label, range, kessler }, idx) => {
          const dCount = debrisCounts[idx];
          const sCount = satCounts[idx];
          const dPct   = (dCount / maxTotal) * 100;
          const sPct   = (sCount / maxTotal) * 100;
          const leo    = isLEOBand(range);
          const rowBg  = idx % 2 === 0 ? '#1c1c1c' : '#181818';

          return (
            <HeatmapRow
              key={label}
              label={label}
              dCount={dCount}
              sCount={sCount}
              dPct={dPct}
              sPct={sPct}
              isLEO={leo}
              kessler={kessler}
              rowBg={rowBg}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, color: '#666666', fontSize: 10, lineHeight: 1.5 }}>
        Bar width proportional to max band total ({maxTotal.toLocaleString()}).&nbsp;
        Altitude derived from mean motion / orbital elements where available.
      </div>
    </div>
  );
}
