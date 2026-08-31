import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  School, 
  Cross, 
  Layers, 
  Eye, 
  EyeOff, 
  MapPin, 
  Compass, 
  Maximize2 
} from 'lucide-react';

// Custom Map click handler for point risk evaluation
function MapClickHandler({ onSelectPoint }) {
  useMapEvents({
    click: (e) => {
      onSelectPoint(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function GisRiskMap({ 
  gridPoints = [], 
  villages = [], 
  roads = [], 
  infrastructure = [], 
  landslides = [], 
  selectedPoint = null, 
  onSelectPoint = () => {},
  emergencyHighlight = false,
  customRoute = null
}) {
  const [showGrid, setShowGrid] = useState(true);
  const [showVillages, setShowVillages] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showInfra, setShowInfra] = useState(true);
  const [showLandslides, setShowLandslides] = useState(false);

  // Center on Arunachal Pradesh Pilot Bounding Box (Lat: 28.18, Lon: 95.65)
  const defaultCenter = [28.18, 95.65];
  const defaultZoom = 11;

  // Custom Icon Helpers
  const createCustomIcon = (color, symbol) => {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div style="
        background: ${color};
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color}88;
      ">${symbol}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg-void)', overflow: 'hidden' }}>

      {/* Map Legend — bottom left */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, zIndex: 1000,
        background: 'rgba(9,14,26,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: 'var(--shadow-lg)',
        fontSize: '0.6875rem',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>RISK SCALE</span>
        {[
          { color: 'var(--risk-low)',      label: 'Low (0-25)' },
          { color: 'var(--risk-moderate)', label: 'Moderate (26-50)' },
          { color: 'var(--risk-high)',     label: 'High (51-75)' },
          { color: 'var(--risk-critical)', label: 'Critical (76-100)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapClickHandler onSelectPoint={onSelectPoint} />

        {/* 1. Risk Grid Postings */}
        {showGrid && gridPoints.map((pt, idx) => {
          const color = pt.color || (pt.risk_score > 75 ? '#ef4444' : pt.risk_score > 50 ? '#f97316' : pt.risk_score > 25 ? '#f59e0b' : '#10b981');
          const radius = pt.risk_score > 75 ? 12 : pt.risk_score > 50 ? 9 : 7;
          return (
            <CircleMarker
              key={`grid_${idx}`}
              center={[pt.lat, pt.lon]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: pt.risk_score > 75 ? 0.85 : 0.6,
                weight: pt.risk_score > 75 ? 2 : 1
              }}
              eventHandlers={{
                click: () => onSelectPoint(pt.lat, pt.lon)
              }}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color }}>{pt.risk_level} RISK</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-white">{pt.risk_score}/100</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <p>• Elevation: <b>{pt.elevation} m</b></p>
                    <p>• Slope: <b>{pt.slope}°</b></p>
                    <p>• 3-Day Rain: <b>{pt.rainfall_3d} mm</b></p>
                  </div>
                  <button
                    onClick={() => onSelectPoint(pt.lat, pt.lon)}
                    className="w-full text-center text-[10px] bg-cyan-600 text-white font-bold py-1 rounded mt-1"
                  >
                    Inspect Full Exposure & Factors
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 2. Road Corridors */}
        {showRoads && roads.map((r, idx) => {
          const roadColor = r.criticality === 'CRITICAL' ? '#ef4444' : r.criticality === 'HIGH' ? '#f97316' : '#38bdf8';
          return (
            <Polyline
              key={`road_${idx}`}
              positions={r.waypoints}
              pathOptions={{
                color: roadColor,
                weight: 4.5,
                opacity: 0.85,
                dashArray: r.criticality === 'CRITICAL' ? '6, 6' : undefined
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-white">{r.name}</p>
                  <p className="text-slate-300">Length: {r.length_km} km | Type: {r.type}</p>
                  <p className="text-amber-400 font-semibold mt-1">Hazard Criticality: {r.criticality}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* 3. Custom Route Comparison (Safe Route Tab) */}
        {customRoute && (
          <>
            <Polyline
              positions={customRoute.primary_route.waypoints}
              pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.9 }}
            />
            <Polyline
              positions={customRoute.recommended_alternative_route.waypoints}
              pathOptions={{ color: '#10b981', weight: 6, opacity: 0.95 }}
            />
          </>
        )}

        {/* 4. Villages & Settlements */}
        {showVillages && villages.map((v, idx) => {
          const isHighRisk = v.name === 'Dambuk' || v.name === 'Mayudia' || v.name === 'Aohali';
          const icon = createCustomIcon(isHighRisk ? '#ef4444' : '#10b981', 'V');
          return (
            <Marker
              key={`village_${idx}`}
              position={[v.lat, v.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectPoint(v.lat, v.lon)
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-sm text-cyan-400">
                    <Building2 className="w-4 h-4" />
                    <span>{v.name}</span>
                  </div>
                  <p className="text-slate-300">District: <b>{v.district}</b></p>
                  <p className="text-slate-300">Population: <b>{v.population.toLocaleString()}</b></p>
                  <p className="text-slate-300">Elevation: <b>{v.elevation_m} m</b></p>
                  <div className="bg-emerald-950/60 border border-emerald-800/80 rounded p-1.5 mt-1 text-[11px] text-emerald-300">
                    🛡️ Safe Shelter: <b>{v.safe_shelter}</b>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Infrastructure (Bridges, Hospitals, Schools) */}
        {showInfra && infrastructure.map((inf, idx) => {
          const color = inf.type === 'Bridge' ? '#f59e0b' : inf.type === 'Hospital' ? '#ef4444' : '#8b5cf6';
          const symbol = inf.type === 'Bridge' ? '🌉' : inf.type === 'Hospital' ? '🏥' : '🏫';
          const icon = createCustomIcon(color, symbol);
          return (
            <Marker
              key={`infra_${idx}`}
              position={[inf.lat, inf.lon]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-white">{inf.name}</p>
                  <p className="text-slate-300">Type: {inf.type} | Priority: <b>{inf.importance}</b></p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 6. GSI Historical Landslide points */}
        {showLandslides && landslides.map((ls, idx) => {
          const coords = ls.geometry ? ls.geometry.coordinates : [ls.lon, ls.lat];
          return (
            <CircleMarker
              key={`ls_${idx}`}
              center={[coords[1], coords[0]]}
              radius={4}
              pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: 0.8, weight: 1 }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-pink-400">GSI Verified Landslide</p>
                  <p className="text-slate-300">ID: {ls.properties?.slide_no || 'GSI-LS'}</p>
                  <p className="text-slate-300">Type: {ls.properties?.material || 'Debris'} {ls.properties?.movement || 'Slide'}</p>
                  <p className="text-slate-300">History: {ls.properties?.history || 'Historical'}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 7. Selected Point Highlight */}
        {selectedPoint && (
          <CircleMarker
            center={[selectedPoint.lat, selectedPoint.lon]}
            radius={20}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.25,
              weight: 3,
              dashArray: '4, 4'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
