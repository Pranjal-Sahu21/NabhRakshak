// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Viewer, Entity } from 'resium';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';
import { Cartesian3, Color } from 'cesium';

// Import Cesium CSS
import "cesium/Build/Cesium/Widgets/widgets.css";

const CesiumGlobe = ({ satellites = [], debris = [], onObjectSelect }) => {
    const [positions, setPositions] = useState({});
    const rafRef = useRef(null);
    const lastUpdateRef = useRef(0);

    // Memoize orbits generation to avoid recalculating on every frame unless objects change
    const objects = useMemo(() => [...satellites, ...debris], [satellites, debris]);

    useEffect(() => {
        // Throttle position updates to ~10 FPS instead of 60 FPS
        // Satellite positions change slowly — 10 FPS is visually indistinguishable
        const UPDATE_INTERVAL_MS = 100; // 10 FPS

        const tick = () => {
            rafRef.current = requestAnimationFrame(tick);
            const now = Date.now();
            if (now - lastUpdateRef.current < UPDATE_INTERVAL_MS) return;
            lastUpdateRef.current = now;

            const nowDate = new Date(now);
            const newPositions = {};

            objects.forEach((obj) => {
                if (obj.tleLine1 && obj.tleLine2) {
                    const satrec = satellite.twoline2satrec(obj.tleLine1, obj.tleLine2);
                    const positionAndVelocity = satellite.propagate(satrec, nowDate);
                    const positionEci = positionAndVelocity.position;

                    if (positionEci) {
                        const gmst = satellite.gstime(nowDate);
                        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                        const position = Cartesian3.fromRadians(
                            positionGd.longitude,
                            positionGd.latitude,
                            positionGd.height * 1000
                        );
                        newPositions[obj.id] = position;
                    }
                } else {
                    const time = now / 1000;
                    const lon = (Number(obj.longitude) || 0) + (obj.velocity || 0) * (time % 3600) / 3600;
                    const lat = Number(obj.latitude) || 0;
                    const alt = (Number(obj.altitude) || 400) * 1000;
                    const position = Cartesian3.fromDegrees(lon, lat, alt);
                    newPositions[obj.id] = position;
                }
            });

            setPositions(newPositions);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [objects]);

    return (
        <Viewer full>
            <div className="absolute top-4 left-4 z-50 bg-black/50 p-2 text-white rounded">
                Cesium Globe Active
            </div>

            {/* Render Objects */}
            {objects.map((obj) => (
                <Entity
                    key={obj.id}
                    name={obj.name}
                    position={positions[obj.id]}
                    point={{ pixelSize: 10, color: obj.type === 'satellite' ? Color.CYAN : Color.RED }}
                    description={`Type: ${obj.type}\nAltitude: ${obj.altitude} km`}
                    onClick={() => onObjectSelect && onObjectSelect(obj)}
                />
            ))}
        </Viewer>
    );
};

export default CesiumGlobe;
