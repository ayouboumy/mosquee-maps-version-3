import { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import { Map, Marker, Source, Layer, useMap, NavigationControl, FullscreenControl, GeolocateControl } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock } from 'lucide-react';
import { useAppStore, RouteProfile } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';
import QiblaCompass from './QiblaCompass';

// Fix for Vite environment variables in TS
interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXlvdWJvdW15IiwiYSI6ImNtbmF5dDVzZTBuZzEyb3F5cDlpY3g1aTcifQ.1VyhjdZII-HnNd8-SdfgRg';
mapboxgl.accessToken = MAPBOX_TOKEN;

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

function MapController({ showNearest, nearestMosques, routingToMosque, selectedMosque }: any) {
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
        map.fitBounds(bounds, { padding: 80, duration: 1000 });
        map.easeTo({ pitch: 45, bearing: 0, duration: 1000 });
      }
    } else if (selectedMosque) {
      if (typeof selectedMosque.latitude === 'number' && typeof selectedMosque.longitude === 'number') {
        map.flyTo({ 
          center: [selectedMosque.longitude, selectedMosque.latitude], 
          zoom: 17, 
          pitch: 60,
          duration: 2000,
          essential: true
        });
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
        map.fitBounds(bounds, { padding: 100, duration: 1500 });
        map.easeTo({ pitch: 45, duration: 1500 });
      }
    } else if (!showNearest && isUserLocationValid && !routingToMosque) {
      map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13, pitch: 0, bearing: 0, duration: 1000 });
    }
  }, [userLocation, isUserLocationValid, map, showNearest, nearestMosques, routingToMosque, selectedMosque]);

  return null;
}

function RouteLine({ start, end, isMainRoute, routeProfile = 'driving', routeKey }: { start: [number, number], end: [number, number], isMainRoute?: boolean, routeProfile?: string | RouteProfile, routeKey: string, key?: string }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const { setRouteInfo } = useAppStore();

  useEffect(() => {
    if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) return;
    
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'walking' : 'driving';
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&alternatives=true&access_token=${MAPBOX_TOKEN}`;
        
        const response = await fetch(url);
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          // Sort alternatives by DISTANCE to find the physically shortest road
          const routes = [...data.routes].sort((a, b) => a.distance - b.distance);
          const shortestRoute = routes[0];
          
          if (shortestRoute.geometry) {
            setPositions(shortestRoute.geometry.coordinates);
            if (isMainRoute && shortestRoute.distance) {
              setRouteInfo({ distance: shortestRoute.distance, duration: shortestRoute.duration });
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
  const innerColor = isMainRoute 
    ? (isDriving ? '#3b82f6' : '#10b981') 
    : '#94a3b8';

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
    <Source id={`route-source-${routeKey}`} type="geojson" data={geojson}>
      {isMainRoute && (
        <Layer 
          id={`route-glow-${routeKey}`} 
          type="line" 
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 
            'line-color': innerColor, 
            'line-width': 12, 
            'line-blur': 8,
            'line-opacity': 0.6
          }} 
        />
      )}
      <Layer 
        id={`route-inner-${routeKey}`} 
        type="line" 
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 
          'line-color': innerColor, 
          'line-width': isMainRoute ? 6 : 4, 
          'line-opacity': isMainRoute ? 1 : 0.6 
        }} 
      />
      {isMainRoute && (
        <Layer 
          id={`route-dash-${routeKey}`} 
          type="line" 
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 
            'line-color': '#ffffff', 
            'line-width': 2, 
            'line-opacity': 0.8, 
            'line-dasharray': [1, 2] 
          }} 
        />
      )}
    </Source>
  );
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { mosques, userLocation, selectedMosque, setSelectedMosque, language, routingToMosque, setRoutingToMosque, routeProfile, selectedCommune, mapTheme } = useAppStore();
  
  const mapRef = useRef<any>(null);
  const [roadDurations, setRoadDurations] = useState<Record<number, number>>({});
  const [roadDistances, setRoadDistances] = useState<Record<number, number>>({});

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  const [viewState, setViewState] = useState({
    longitude: isUserLocationValid ? userLocation.longitude : -7.5898,
    latitude: isUserLocationValid ? userLocation.latitude : 33.5731,
    zoom: 12,
    pitch: 0,
    bearing: 0
  });

  const currentTheme = useMemo(() => {
    if (mapTheme === 'auto') {
      const hour = new Date().getHours();
      return (hour >= 19 || hour <= 6) ? 'dark' : 'light';
    }
    return mapTheme;
  }, [mapTheme]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const updateConfig = () => {
      try {
        if (map.getImport('basemap')) {
          map.setConfigProperty('basemap', 'theme', currentTheme);
          // Set lightPreset for richer dark/light experience
          const preset = currentTheme === 'dark' ? 'night' : 'day';
          map.setConfigProperty('basemap', 'lightPreset', preset);
          
          // Add 3D Fog/Atmosphere for "Expert" premium feel
          map.setFog({
            'range': [0.5, 10],
            'color': currentTheme === 'dark' ? '#242b3b' : '#ffffff',
            'high-color': currentTheme === 'dark' ? '#161c24' : '#add8e6',
            'space-color': currentTheme === 'dark' ? '#0b1015' : '#d8f2ff',
            'horizon-blend': 0.02
          });
        }
      } catch (e) {
        console.warn("Could not set map config:", e);
      }
    };

    if (map.isStyleLoaded()) {
      updateConfig();
    } else {
      map.once('style.load', updateConfig);
    }
  }, [currentTheme]);

  const filteredByCommune = useMemo(() => {
    return mosques.filter(m => 
      typeof m.latitude === 'number' && !isNaN(m.latitude) && 
      (!selectedCommune || m.commune === selectedCommune)
    );
  }, [mosques, selectedCommune]);

  useEffect(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0 || !showNearest) return;

    const fetchMatrix = async () => {
      try {
        // Sort by straight line distance first to get reasonable candidates
        const sortedByStraight = filteredByCommune
          .map(m => ({ 
            ...m, 
            straightDist: getDistance(
              { lat: userLocation.latitude, lng: userLocation.longitude },
              { lat: m.latitude, lng: m.longitude }
            ) 
          }))
          .sort((a, b) => a.straightDist - b.straightDist);

        // Check top 50 (two batches of 25)
        const candidates = sortedByStraight.slice(0, 50);
        if (candidates.length === 0) return;

        const profile = routeProfile === 'foot' ? 'walking' : 'driving';
        const batch1 = candidates.slice(0, 25);
        const batch2 = candidates.slice(25, 50);
        
        const fetchBatch = async (batch: typeof candidates) => {
          if (batch.length === 0) return [];
          const coordinates = [
            `${userLocation.longitude},${userLocation.latitude}`,
            ...batch.map(c => `${c.longitude},${c.latitude}`)
          ].join(';');
          const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coordinates}?annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(url);
          return await res.json();
        };

        const [data1, data2] = await Promise.all([fetchBatch(batch1), fetchBatch(batch2)]);
        
        const durationsMap: Record<number, number> = {};
        const distancesMap: Record<number, number> = {};

        const processData = (data: any, batch: typeof candidates) => {
          if (data.code === 'Ok' && data.durations && data.distances) {
            data.durations[0].forEach((dur: number, idx: number) => {
              if (idx > 0 && dur !== null) {
                const mosqueId = batch[idx - 1].id;
                durationsMap[mosqueId] = dur;
                distancesMap[mosqueId] = data.distances[0][idx];
              }
            });
          }
        };

        processData(data1, batch1);
        processData(data2, batch2);

        setRoadDurations(durationsMap);
        setRoadDistances(distancesMap);
      } catch (e) {
        console.error("Matrix API Error:", e);
      }
    };

    fetchMatrix();
  }, [userLocation, filteredByCommune, routeProfile, showNearest]);

  const nearestMosques = useMemo(() => {
    if (!showNearest) return [];
    
    return filteredByCommune
      .map(m => ({
        ...m,
        duration: roadDurations[m.id] !== undefined ? roadDurations[m.id] : Infinity,
        distance: roadDistances[m.id] !== undefined ? roadDistances[m.id] : Infinity
      }))
      .filter(m => m.distance !== Infinity)
      // SORT BY DISTANCE (per user request for the 'shortest road')
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [filteredByCommune, roadDurations, showNearest]);

  const displayedMosques = showNearest ? nearestMosques : filteredByCommune;

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

  return (
    <div className="absolute inset-0 z-0 bg-gray-900" style={{ isolation: 'isolate' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        projection={{ name: 'globe' }}
      >
        <div className="absolute top-4 right-4 z-[9999] flex flex-col gap-2">
           <NavigationControl position="top-right" />
           <GeolocateControl position="top-right" trackUserLocation={true} showUserHeading={true} />
           <FullscreenControl position="top-right" />
        </div>
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        
        <MapController 
          showNearest={showNearest} 
          nearestMosques={nearestMosques} 
          routingToMosque={routingToMosque} 
          selectedMosque={selectedMosque} 
        />

        {/* Selected Mosque Glow Layer */}
        {selectedMosque && (
          <Source
            id="selected-glow-source"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: [selectedMosque.longitude, selectedMosque.latitude] }
            }}
          >
            <Layer
              id="selected-glow-layer-inner"
              type="circle"
              paint={{
                'circle-radius': 15,
                'circle-color': '#10b981',
                'circle-opacity': 0.8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
            <Layer
              id="selected-glow-layer-outer"
              type="circle"
              paint={{
                'circle-radius': 40,
                'circle-color': '#10b981',
                'circle-opacity': 0.2,
                'circle-blur': 1
              }}
            />
          </Source>
        )}

        {isUserLocationValid && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <UserMarkerHTML />
          </Marker>
        )}

        {routingToMosque && isUserLocationValid && (
          <RouteLine
            routeKey={`${routingToMosque.id}-${routeProfile}-main`}
            start={[userLocation.longitude, userLocation.latitude]}
            end={[routingToMosque.longitude, routingToMosque.latitude]}
            isMainRoute={true}
            routeProfile={routeProfile}
          />
        )}

        {showNearest && isUserLocationValid && !routingToMosque && nearestMosques.map((mosque) => (
          <RouteLine
            key={`alt-${mosque.id}`}
            routeKey={`${mosque.id}-${routeProfile}-alt`}
            start={[userLocation.longitude, userLocation.latitude]}
            end={[Number(mosque.longitude), Number(mosque.latitude)]}
            routeProfile={routeProfile}
          />
        ))}

        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                <div 
                  className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white ring-4 ring-emerald-600/30 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(Number(cluster.id)), 20);
                    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 800 });
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
               <Marker key={`dest-${mosque.id}`} longitude={mosque.longitude} latitude={mosque.latitude} anchor="bottom">
                  <div onClick={(e) => { e.stopPropagation(); setSelectedMosque(mosque); }}>
                     <DestinationMarkerHTML />
                  </div>
               </Marker>
             )
          }

          if (routingToMosque && routingToMosque.id !== mosque.id) return null;

          return (
            <Marker key={mosque.id} longitude={mosque.longitude} latitude={mosque.latitude} anchor="bottom" style={{ zIndex: isSelected ? 100 : 1 }}>
              <div onClick={(e) => { e.stopPropagation(); setSelectedMosque(mosque); }}>
                <MosqueMarkerHTML isSelected={isSelected} />
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Spiritual & Navigation Overlays */}
      <QiblaCompass />

      <AnimatePresence>
        {showNearest && nearestMosques.length > 0 && !routingToMosque && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="absolute bottom-24 left-0 right-0 z-[1000] pb-2 pt-4 px-4 overflow-x-auto scrollbar-hide flex gap-4 min-w-max"
          >
            {nearestMosques.map((mosque, i) => (
              <motion.button
                key={mosque.id}
                onClick={() => setSelectedMosque(mosque)}
                className={`flex flex-col text-left bg-white/95 backdrop-blur-xl rounded-[24px] p-3 shadow-2xl w-[260px] border-2 transition-all active:scale-95 ${selectedMosque?.id === mosque.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-transparent'}`}
              >
                <div className="relative w-full h-24 rounded-[16px] overflow-hidden mb-3">
                  {mosque.image ? (
                    <img src={mosque.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                      <Navigation className="text-emerald-500 opacity-20" size={32} />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1.5">
                    <span className="text-white text-[10px] font-black uppercase">#{i + 1} {t('Nearest', language)}</span>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 truncate mb-2">{getLocalizedName(mosque, language)}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                    <Clock size={12} />
                    {roadDurations[mosque.id] ? Math.round(roadDurations[mosque.id] / 60) : 0} min
                  </div>
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase truncate max-w-[100px]">{t(mosque.type, language)}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
