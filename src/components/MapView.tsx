import { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import Map, { Marker, Source, Layer, useMap } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Custom HTML Markers using Divs (matching Leaflet style)
const MosqueMarkerHTML = ({ isSelected }: { isSelected: boolean }) => (
  <div className={`relative flex items-center justify-center cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}`}>
    <div style={{
      width: isSelected ? '44px' : '36px',
      height: isSelected ? '44px' : '36px',
      background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
      borderRadius: '50% 50% 50% 0',
      transform: 'rotate(-45deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isSelected ? '0 0 0 4px rgba(16, 185, 129, 0.3), 0 6px 16px rgba(16, 185, 129, 0.5)' : '0 4px 12px rgba(5, 150, 105, 0.4)',
      border: '2px solid white'
    }}>
      <div style={{ transform: 'rotate(45deg)', paddingTop: isSelected ? '3px' : '2px', paddingLeft: '1px' }}>
        <svg width={isSelected ? "22" : "18"} height={isSelected ? "22" : "18"} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
          <path d="M12 2C12 2 15 6 15 10C15 14 12 18 12 18C12 18 9 14 9 10C9 6 12 2 12 2Z"></path>
          <path d="M12 18V22"></path>
          <path d="M8 22H16"></path>
          <path d="M15 11.5C16.5 12 18.5 13 18.5 15C18.5 16 17 18 12 18C7 18 5.5 16 5.5 15C5.5 13 7.5 12 9 11.5"></path>
        </svg>
      </div>
    </div>
  </div>
);

const DestinationMarkerHTML = () => (
  <div className="relative flex items-center justify-center cursor-pointer z-50">
    <div style={{
      width: '36px', height: '36px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      borderRadius: '50% 50% 50% 0',
      transform: 'rotate(-45deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
      border: '2px solid white'
    }}>
      <div style={{ transform: 'rotate(45deg)', paddingTop: '2px', paddingLeft: '1px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
    </div>
  </div>
);

const UserMarkerHTML = () => (
  <div className="relative flex items-center justify-center z-50">
    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md relative">
      <div className="absolute inset-[-8px] rounded-full bg-blue-500/30 animate-ping" />
    </div>
  </div>
);

function MapController({ showNearest, nearestMosques, routingToMosque, selectedMosque, viewport, setViewport }: any) {
  const { userLocation } = useAppStore();
  const { current: map } = useMap();

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  useEffect(() => {
    if (!map) return;
    
    if (routingToMosque && isUserLocationValid) {
      if (typeof routingToMosque.latitude === 'number' && typeof routingToMosque.longitude === 'number') {
        const bounds: [number, number, number, number] = [
          Math.min(userLocation.longitude, routingToMosque.longitude),
          Math.min(userLocation.latitude, routingToMosque.latitude),
          Math.max(userLocation.longitude, routingToMosque.longitude),
          Math.max(userLocation.latitude, routingToMosque.latitude)
        ];
        map.fitBounds(bounds, { padding: 50 });
      }
    } else if (selectedMosque) {
      if (typeof selectedMosque.latitude === 'number' && typeof selectedMosque.longitude === 'number') {
        map.flyTo({ center: [selectedMosque.longitude, selectedMosque.latitude], zoom: 15, duration: 1500 });
      }
    } else if (showNearest && isUserLocationValid && nearestMosques.length > 0) {
      const validNearest = nearestMosques.filter((m: any) => 
        typeof m.latitude === 'number' && !isNaN(m.latitude) &&
        typeof m.longitude === 'number' && !isNaN(m.longitude)
      );
      if (validNearest.length > 0) {
        const lons = [userLocation.longitude, ...validNearest.map((m: any) => m.longitude)];
        const lats = [userLocation.latitude, ...validNearest.map((m: any) => m.latitude)];
        const bounds: [number, number, number, number] = [
          Math.min(...lons), Math.min(...lats),
          Math.max(...lons), Math.max(...lats)
        ];
        map.fitBounds(bounds, { padding: 50 });
      }
    } else if (!showNearest && isUserLocationValid && !routingToMosque) {
      map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13, duration: 1000 });
    }
  }, [userLocation, isUserLocationValid, map, showNearest, nearestMosques, routingToMosque, selectedMosque]);

  return null;
}

function RouteLine({ start, end, straightDistance, isMainRoute, routeProfile = 'driving', routeKey }: { start: [number, number], end: [number, number], straightDistance: number, isMainRoute?: boolean, routeProfile?: string, routeKey: string }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const [routeDistance, setRouteDistance] = useState<number>(straightDistance);
  const { setRouteInfo } = useAppStore();

  useEffect(() => {
    if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) return;
    
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'walking' : 'driving';
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
        
        const response = await fetch(url);
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          const bestRoute = data.routes[0];
          if (bestRoute.geometry) {
            setPositions(bestRoute.geometry.coordinates); // Mapbox returns GeoJSON [lng, lat]
            if (bestRoute.distance) {
              setRouteDistance(bestRoute.distance);
              if (isMainRoute) {
                setRouteInfo({ distance: bestRoute.distance, duration: bestRoute.duration });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };
    fetchRoute();
    return () => { isMounted = false; };
  }, [start[0], start[1], end[0], end[1], isMainRoute, setRouteInfo, routeProfile]);

  useEffect(() => {
    return () => { if (isMainRoute) setRouteInfo(null); };
  }, [isMainRoute, setRouteInfo]);

  const isDriving = routeProfile === 'driving';
  const mainInnerColor = isDriving ? '#3B82F6' : '#10B981';
  const mainOuterColor = isDriving ? '#1D4ED8' : '#047857'; 

  const innerColor = isMainRoute ? mainInnerColor : '#9CA3AF';
  const outerColor = isMainRoute ? mainOuterColor : '#4B5563';

  const innerWeight = 6;
  const outerWeight = 10;
  
  const validPositions = positions.filter(p => p && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1]));
  if (validPositions.length < 2) return null;

  const geojson: any = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: validPositions
    }
  };

  return (
    <>
      <Source id={`route-source-${routeKey}`} type="geojson" data={geojson}>
        <Layer 
          id={`route-outer-${routeKey}`} 
          type="line" 
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': outerColor, 'line-width': outerWeight, 'line-opacity': isMainRoute ? 1 : 0.8 }} 
        />
        <Layer 
          id={`route-inner-${routeKey}`} 
          type="line" 
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': innerColor, 'line-width': innerWeight, 'line-opacity': 1 }} 
        />
        <Layer 
          id={`route-dash-${routeKey}`} 
          type="line" 
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#ffffff', 'line-width': innerWeight - 2, 'line-opacity': 0.8, 'line-dasharray': isMainRoute ? [1, 2] : [2, 3] }} 
        />
      </Source>
    </>
  );
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { mosques, userLocation, selectedMosque, setSelectedMosque, language, routingToMosque, setRoutingToMosque, routeProfile, selectedCommune, mapStyle } = useAppStore();
  
  const mapRef = useRef<any>(null);
  
  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  const [viewState, setViewState] = useState({
    longitude: isUserLocationValid ? userLocation.longitude : -7.5898,
    latitude: isUserLocationValid ? userLocation.latitude : 33.5731,
    zoom: 12,
    pitch: 45,
    bearing: 0
  });

  const filteredByCommune = useMemo(() => {
    const validMosques = mosques.filter(m => 
      typeof m.latitude === 'number' && !isNaN(m.latitude) && m.latitude !== 0 &&
      typeof m.longitude === 'number' && !isNaN(m.longitude) && m.longitude !== 0
    );
    if (!selectedCommune) return validMosques;
    return validMosques.filter(m => m.commune === selectedCommune);
  }, [mosques, selectedCommune]);

  const [roadDistances, setRoadDistances] = useState<Record<number, number>>({});
  const [roadDurations, setRoadDurations] = useState<Record<number, number>>({});

  const nearestMosques = useMemo(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return [];
    
    const withStraightDistance = filteredByCommune.map(mosque => {
      try {
        return {
          ...mosque,
          straightDistance: getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: mosque.latitude, longitude: mosque.longitude }
          )
        };
      } catch (e) {
        return { ...mosque, straightDistance: Infinity };
      }
    });

    const topCandidates = withStraightDistance
      .sort((a, b) => a.straightDistance - b.straightDistance)
      .slice(0, 15);

    const withRoadMetrics = topCandidates.map(m => ({
      ...m,
      distance: roadDistances[m.id] !== undefined ? roadDistances[m.id] : m.straightDistance,
      duration: roadDurations[m.id] !== undefined ? roadDurations[m.id] : Infinity
    }));

    return withRoadMetrics
      .sort((a, b) => {
        if (a.duration !== Infinity && b.duration !== Infinity) return a.duration - b.duration;
        return a.distance - b.distance;
      })
      .slice(0, 3);
  }, [filteredByCommune, userLocation, roadDistances, roadDurations]);

  // Fetch true Mapbox distances for accuracy
  useEffect(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return;

    const fetchRoadDistances = async () => {
      try {
        const top15 = [...filteredByCommune]
          .map(m => {
            let d = Infinity;
            try { d = getDistance({ latitude: userLocation.latitude, longitude: userLocation.longitude }, { latitude: m.latitude, longitude: m.longitude }); } catch (e) {}
            return { id: m.id, lat: m.latitude, lng: m.longitude, d };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, 5);

        if (top15.length === 0) return;

        const distances: Record<number, number> = {};
        const durations: Record<number, number> = {};

        const promises = top15.map(async (m) => {
          try {
            const profile = 'driving';
            const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${userLocation.longitude},${userLocation.latitude};${m.lng},${m.lat}?access_token=${MAPBOX_TOKEN}`;
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              const bestRoute = data.routes[0];
              return { id: m.id, distance: bestRoute.distance, duration: bestRoute.duration };
            }
          } catch (e) { console.error(e); }
          return null;
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res) {
            distances[res.id] = res.distance;
            durations[res.id] = res.duration;
          }
        });

        setRoadDistances(distances);
        setRoadDurations(durations);
      } catch (error) { console.error(error); }
    };
    fetchRoadDistances();
  }, [userLocation, filteredByCommune, routeProfile]);

  const displayedMosques = showNearest && isUserLocationValid ? nearestMosques : filteredByCommune;

  // Supercluster setup for Mapbox
  const points = useMemo(() => {
    return displayedMosques.map(m => ({
      type: "Feature",
      properties: { cluster: false, mosqueId: m.id, mosque: m },
      geometry: { type: "Point", coordinates: [m.longitude, m.latitude] }
    }));
  }, [displayedMosques]);

  const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() as [number, number, number, number] : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  const mapStyleUrl = mapStyle === 'street' 
    ? 'mapbox://styles/mapbox/streets-v12'
    : 'mapbox://styles/mapbox/satellite-streets-v12';

  return (
    <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        mapStyle={mapStyleUrl}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        
        {/* Sky styling for 3D look */}
        <Layer
          id="sky"
          type="sky"
          paint={{
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }}
        />

        {/* 3D Buildings */}
        {mapStyle === 'street' && (
           <Layer
             id="3d-buildings"
             source="composite"
             source-layer="building"
             filter={['==', 'extrude', 'true']}
             type="fill-extrusion"
             minzoom={15}
             paint={{
               'fill-extrusion-color': '#aaa',
               'fill-extrusion-height': ['get', 'height'],
               'fill-extrusion-base': ['get', 'min_height'],
               'fill-extrusion-opacity': 0.6
             }}
           />
        )}

        <MapController showNearest={showNearest} nearestMosques={nearestMosques} routingToMosque={routingToMosque} selectedMosque={selectedMosque} />

        {/* User Location */}
        {isUserLocationValid && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <UserMarkerHTML />
          </Marker>
        )}

        {/* Main Routing Line */}
        {routingToMosque && isUserLocationValid && (
          <RouteLine
            routeKey={`${routingToMosque.id}-${routeProfile}-main`}
            start={[userLocation.longitude, userLocation.latitude]}
            end={[routingToMosque.longitude, routingToMosque.latitude]}
            straightDistance={getDistance({ latitude: userLocation.latitude, longitude: userLocation.longitude }, { latitude: routingToMosque.latitude, longitude: routingToMosque.longitude })}
            isMainRoute={true}
            routeProfile={routeProfile}
          />
        )}

        {/* Nearest Mosques Secondary Target Routes */}
        {showNearest && isUserLocationValid && !routingToMosque && nearestMosques.map((mosque) => {
          if (typeof mosque.latitude !== 'number' || typeof mosque.longitude !== 'number') return null;
          return (
            <RouteLine
              routeKey={`${mosque.id}-${routeProfile}-alt`}
              start={[userLocation.longitude, userLocation.latitude]}
              end={[mosque.longitude, mosque.latitude]}
              straightDistance={(mosque as any).distance || 0}
              routeProfile={routeProfile}
            />
          );
        })}

        {/* Clustering and Markers */}
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                <div 
                  className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white ring-4 ring-emerald-600/30 cursor-pointer hover:bg-emerald-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(Number(cluster.id)), 20);
                    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 500 });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          const mosque = cluster.properties.mosque;
          const isSelected = selectedMosque?.id === mosque.id;

          if (routingToMosque && routingToMosque.id === mosque.id) {
             return (
               <Marker key={mosque.id} longitude={mosque.longitude} latitude={mosque.latitude} anchor="bottom">
                  <div onClick={(e) => { e.stopPropagation(); setSelectedMosque(mosque); }}>
                     <DestinationMarkerHTML />
                  </div>
               </Marker>
             )
          }

          if (routingToMosque && routingToMosque.id !== mosque.id) {
             return null; // hide other markers during navigation
          }

          return (
            <Marker key={mosque.id} longitude={mosque.longitude} latitude={mosque.latitude} anchor="bottom" style={{ zIndex: isSelected ? 100 : 1 }}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMosque(mosque);
                  // Optionally zoom into mosque on click
                  mapRef.current?.flyTo({ center: [mosque.longitude, mosque.latitude], zoom: 16 });
                }}
              >
                <div className="relative group/marker">
                  <MosqueMarkerHTML isSelected={isSelected} />
                  
                  {/* Native Mapbox doesn't use Tooltip components, we just show a label conditionally or on hover */}
                  {(viewState.zoom >= 14 || showNearest || isSelected) && (
                    <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-md px-3 py-1.5 rounded-xl border border-gray-100 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      <p className="text-xs font-black text-gray-800">{getLocalizedName(mosque, language)}</p>
                      {showNearest && roadDistances[mosque.id] !== undefined && (
                        <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded inline-block mt-0.5">
                          {(roadDistances[mosque.id] / 1000).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Marker>
          );
        })}

      </Map>

      {/* Near Mosques Carousel */}
      <AnimatePresence>
        {showNearest && nearestMosques.length > 0 && !routingToMosque && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-24 left-0 right-0 z-[1000] pb-2 pt-4 px-4 overflow-x-auto scrollbar-hide pointer-events-auto"
          >
            <div className="flex gap-4 min-w-max">
              {nearestMosques.map((mosque, i) => (
                <motion.button
                  key={mosque.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    setSelectedMosque(mosque);
                    setRoutingToMosque(null);
                  }}
                  className={`flex flex-col text-left bg-white/95 backdrop-blur-xl rounded-[24px] p-3 shadow-bottom-sheet w-[240px] border transition-all active:scale-95 ${selectedMosque?.id === mosque.id ? 'border-emerald-400 ring-4 ring-emerald-500/10' : 'border-white/50'}`}
                >
                  <div className="relative w-full h-24 rounded-[16px] overflow-hidden mb-3">
                     {mosque.image ? (
                      <img src={mosque.image} alt={getLocalizedName(mosque, language)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-100" />
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white text-[10px] uppercase font-black tracking-widest leading-none">
                        #{i + 1} {t('Nearest', language)}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-gray-900 leading-tight mb-1 truncate">{getLocalizedName(mosque, language)}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 font-bold px-2 py-1 rounded-lg">
                      {roadDurations[mosque.id] ? (
                        <>
                          <Clock size={12} className="shrink-0" />
                          {Math.round(roadDurations[mosque.id] / 60)} min
                        </>
                      ) : (
                        <>
                          <Navigation size={12} className="shrink-0" />
                          {(() => {
                             try {
                               return (getDistance(
                                 { latitude: userLocation!.latitude, longitude: userLocation!.longitude },
                                 { latitude: mosque.latitude, longitude: mosque.longitude }
                               ) / 1000).toFixed(1) + ' km';
                             } catch (e) {
                               return '';
                             }
                          })()}
                        </>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{t(mosque.type, language)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
