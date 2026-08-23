import React, { useState, useEffect, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return 'Passed';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function abbreviate(name) {
  if (name.length <= 16) return name;
  return name.slice(0, 15) + '\u2026';
}

const SEVERITY_TEXT = {
  critical: 'text-[#c27060]',
  high:     'text-[#c29060]',
  medium:   'text-[#a0a060]',
  low:      'text-[#7a9878]',
};

const SEVERITY_DOT = {
  critical: '#c27060',
  high:     '#c29060',
  medium:   '#a0a060',
  low:      '#7a9878',
};

const SEVERITY_LABEL = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  low:      'LOW',
};

// ---------------------------------------------------------------------------
// Mock data factory
// ---------------------------------------------------------------------------

function buildMockEvents(now) {
  const raw = [
    {
      id: 'CJ-001',
      primaryObject: 'CARTOSAT-3',
      secondaryObject: '1999-025RK',
      hoursFromNow: 2.3,
      probability: '1 in 890',
      missDistance: 0.42,
      severity: 'critical',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-002',
      primaryObject: 'RESOURCESAT-2A',
      secondaryObject: '2007-049AE',
      hoursFromNow: 5.7,
      probability: '1 in 4,120',
      missDistance: 3.18,
      severity: 'high',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-003',
      primaryObject: 'RISAT-2BR1',
      secondaryObject: '2012-044C',
      hoursFromNow: 8.1,
      probability: '1 in 2,340',
      missDistance: 1.76,
      severity: 'high',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-004',
      primaryObject: 'OCEANSAT-3',
      secondaryObject: '1993-036F',
      hoursFromNow: 11.4,
      probability: '1 in 9,800',
      missDistance: 6.54,
      severity: 'medium',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-005',
      primaryObject: 'GSAT-30',
      secondaryObject: '2018-092G',
      hoursFromNow: 15.2,
      probability: '1 in 21,500',
      missDistance: 12.30,
      severity: 'low',
      orbitType: 'GEO',
    },
    {
      id: 'CJ-006',
      primaryObject: 'EOS-04',
      secondaryObject: '2000-017B',
      hoursFromNow: 19.8,
      probability: '1 in 1,670',
      missDistance: 0.89,
      severity: 'critical',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-007',
      primaryObject: 'CARTOSAT-2E',
      secondaryObject: '2004-049C',
      hoursFromNow: 24.5,
      probability: '1 in 6,300',
      missDistance: 4.71,
      severity: 'medium',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-008',
      primaryObject: 'IRNSS-1G',
      secondaryObject: '2011-058D',
      hoursFromNow: 30.1,
      probability: '1 in 14,200',
      missDistance: 9.03,
      severity: 'low',
      orbitType: 'MEO',
    },
    {
      id: 'CJ-009',
      primaryObject: 'RISAT-1A',
      secondaryObject: '2016-007AK',
      hoursFromNow: 36.6,
      probability: '1 in 3,050',
      missDistance: 2.14,
      severity: 'high',
      orbitType: 'LEO',
    },
    {
      id: 'CJ-010',
      primaryObject: 'SCATSAT-1',
      secondaryObject: '2009-028B',
      hoursFromNow: 44.9,
      probability: '1 in 18,700',
      missDistance: 17.60,
      severity: 'low',
      orbitType: 'LEO',
    },
  ];

  return raw.map((e) => ({
    ...e,
    tcaTime: addHours(now, e.hoursFromNow),
  }));
}

// ---------------------------------------------------------------------------
// Card content
// ---------------------------------------------------------------------------

function CardContent({ event, ms }) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#666666] tracking-widest text-[10px]">
          {event.orbitType}
        </span>
        <span className={`font-normal tracking-wider text-[10px] ${SEVERITY_TEXT[event.severity]}`}>
          {SEVERITY_LABEL[event.severity]}
        </span>
      </div>

      <div className="text-[#e8e8e8] font-medium mb-0.5 truncate leading-tight text-xs">
        {abbreviate(event.primaryObject)}
      </div>

      <div className="text-[#666666] text-[10px] mb-0.5">vs</div>

      <div className="text-[#666666] font-mono mb-2 truncate text-[10px]">
        {event.secondaryObject}
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[#e8e8e8] font-mono font-normal text-xs">
          {event.missDistance.toFixed(2)}
        </span>
        <span className="text-[#666666] text-[10px]">km</span>
      </div>

      <div className="text-[#666666] text-[10px] mb-2">
        P: {event.probability}
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-[#2a2a2a]">
        <span className="text-[#666666] text-[10px]">TCA in</span>
        <span className="font-mono text-[#e8e8e8] font-medium text-[10px]">
          {formatCountdown(ms)}
        </span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Timeline track
// ---------------------------------------------------------------------------

function TimelineTrack({ events }) {
  const totalWidth = events.length * 160 + (events.length - 1) * 24;

  return (
    <div style={{ position: 'relative', width: `${totalWidth}px`, height: '24px' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: '#2a2a2a',
          transform: 'translateY(-50%)',
        }}
      />
      {events.map((event, i) => {
        const center = i * 184 + 80;
        return (
          <div
            key={event.id}
            style={{
              position: 'absolute',
              left: `${center}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: SEVERITY_DOT[event.severity],
              border: '2px solid #111111',
              zIndex: 1,
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Next Closest Approach Banner
// ---------------------------------------------------------------------------

function NextApproachBanner({ event, now }) {
  const ms = event.tcaTime - now;
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border border-[#2a2a2a] rounded mb-4 bg-[#1c1c1c]">
      <div className="flex items-center gap-2">
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: SEVERITY_DOT[event.severity],
            flexShrink: 0,
          }}
        />
        <span className="text-[#666666] text-xs">Next Closest Approach:</span>
      </div>
      <span className={`text-xs font-medium ${SEVERITY_TEXT[event.severity]}`}>
        {event.primaryObject}
      </span>
      <span className="text-[#666666] text-xs">vs</span>
      <span className="text-xs font-mono text-[#666666]">{event.secondaryObject}</span>
      <span className="text-[#666666] text-xs">&mdash;</span>
      <span className="text-xs text-[#e8e8e8] font-mono font-medium">
        {formatCountdown(ms)}
      </span>
      <span className="text-[#666666] text-xs ml-auto">
        {event.missDistance.toFixed(2)} km&nbsp;&nbsp;&middot;&nbsp;&nbsp;P: {event.probability}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ConjunctionTimeline() {
  const [now, setNow] = useState(() => new Date());

  const events = useMemo(() => {
    const mountTime = new Date();
    return buildMockEvents(mountTime);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextEvent = events[0];
  const criticalCount = events.filter(
    (e) => e.severity === 'critical' || e.severity === 'high'
  ).length;

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-normal text-[#e8e8e8] tracking-wide uppercase">
            Conjunction Timeline
          </h2>
          <span className="text-xs text-[#666666] border border-[#2a2a2a] rounded px-1.5 py-0.5">
            {events.length} events
          </span>
          {criticalCount > 0 && (
            <span className={`text-xs border border-[#2a2a2a] rounded px-1.5 py-0.5 ${SEVERITY_TEXT['critical']}`}>
              {criticalCount} high-risk
            </span>
          )}
        </div>
        <span className="text-[#666666] text-xs font-mono">
          Next TCA: {formatCountdown(nextEvent.tcaTime.getTime() - now.getTime())}
        </span>
      </div>

      {/* Banner */}
      <NextApproachBanner event={nextEvent} now={now} />

      {/* Horizontal scrollable timeline */}
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{ cursor: 'grab' }}
      >
        <div style={{ display: 'inline-flex', flexDirection: 'column', paddingTop: '8px', paddingBottom: '8px' }}>

          {/* Upper row — even-indexed cards */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', minHeight: '164px' }}>
            {events.map((event, i) => (
              <div key={event.id} style={{ minWidth: '160px', width: '160px' }}>
                {i % 2 === 0 ? (
                  <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded p-3 text-xs">
                    <CardContent event={event} ms={event.tcaTime.getTime() - now.getTime()} />
                  </div>
                ) : (
                  <div style={{ height: '1px' }} />
                )}
              </div>
            ))}
          </div>

          {/* Timeline track */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', marginBottom: '8px' }}>
            <TimelineTrack events={events} />
          </div>

          {/* Lower row — odd-indexed cards */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', minHeight: '164px' }}>
            {events.map((event, i) => (
              <div key={event.id} style={{ minWidth: '160px', width: '160px' }}>
                {i % 2 !== 0 ? (
                  <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded p-3 text-xs">
                    <CardContent event={event} ms={event.tcaTime.getTime() - now.getTime()} />
                  </div>
                ) : (
                  <div style={{ height: '1px' }} />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2a2a2a]">
        {['critical', 'high', 'medium', 'low'].map((sev) => (
          <div key={sev} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: SEVERITY_DOT[sev] }} />
            <span className="text-[#666666] text-[10px] capitalize">{sev}</span>
          </div>
        ))}
        <span className="ml-auto text-[#666666] text-[10px] font-mono">
          Window: +48h &nbsp;&middot;&nbsp; Updated live
        </span>
      </div>
    </div>
  );
}
