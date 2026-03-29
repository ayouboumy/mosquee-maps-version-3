import { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import { Map, Marker, Source, Layer, useMap, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl } from 'react-map-gl/mapbox';
import { LocateFixed, MapPin, Layers, Box, Compass } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock, Plus, Minus, Target, Maximize, Map as MapIcon } from 'lucide-react';
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

const UserMarkerHTML = ({ heading = 0, isNavigating }: { heading?: number, isNavigating?: boolean }) => (
  <div className="relative flex items-center justify-center z-50">
    <div className={`w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center relative transition-transform duration-500 ${isNavigating ? 'scale-110' : ''}`}>
      {isNavigating ? (
        <div 
          className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-white mb-[2px]" 
          style={{ transform: `rotate(${heading}deg)` }} 
        />
      ) : (
        <div className="w-2 h-2 rounded-full bg-white" />
      )}
      <div className="absolute inset-[-10px] rounded-full bg-blue-500/30 animate-pulse" />
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

export default function MapView({ 
  showNearest, 
  setShowNearest, 
  isLocating, 
  setIsLocating 
}: { 
  showNearest?: boolean;
  setShowNearest?: (val: boolean) => void;
  isLocating?: boolean;
  setIsLocating?: (val: boolean) => void;
}) {
  const { mosques, userLocation, selectedMosque, setSelectedMosque, language, routingToMosque, setRoutingToMosque, routeProfile, selectedCommune, mapTheme, mapStyle, setMapStyle, setUserLocation, isNavigating, setIsNavigating, routeInfo } = useAppStore();
  
  const mapRef = useRef<any>(null);
  const [is3D, setIs3D] = useState(true);
  const [navHeading, setNavHeading] = useState(0);
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

  const currentMapStyle = useMemo(() => {
    if (mapStyle === 'satellite') return 'mapbox://styles/mapbox/satellite-streets-v12';
    if (currentTheme === 'dark') return 'mapbox://styles/mapbox/dark-v11';
    return 'mapbox://styles/mapbox/streets-v12';
  }, [mapStyle, currentTheme]);

  const handleZoom = (delta: number) => {
    mapRef.current?.zoomTo(mapRef.current.getZoom() + delta, { duration: 300 });
  };

  const handleGeolocate = () => {
    if ('geolocation' in navigator) {
      setIsLocating?.(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
          setIsLocating?.(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating?.(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const toggle3D = () => {
    const new3D = !is3D;
    setIs3D(new3D);
    mapRef.current?.easeTo({
      pitch: new3D ? 60 : 0,
      duration: 1000
    });
  };

  // Adaptive 3D Navigation Camera
  useEffect(() => {
    if (isNavigating && userLocation && routingToMosque && mapRef.current) {
      // Calculate heading towards destination
      const dy = routingToMosque.latitude - userLocation.latitude;
      const dx = routingToMosque.longitude - userLocation.longitude;
      const angle = Math.atan2(dx, dy) * (180 / Math.PI);
      setNavHeading(angle);

      mapRef.current.easeTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 17,
        pitch: 65,
        bearing: angle,
        duration: 1500,
        essential: true
      });
    } else if (!isNavigating && mapRef.current) {
      mapRef.current.easeTo({ pitch: is3D ? 60 : 0, duration: 1000 });
    }
  }, [isNavigating, userLocation, routingToMosque, is3D]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

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
          if (!batch || batch.length === 0) return { code: 'Empty' };
          const coordsArr = [
            `${userLocation.longitude},${userLocation.latitude}`,
            ...batch.map(c => `${c.longitude},${c.latitude}`)
          ];
          const coordinates = coordsArr.join(';');
          const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coordinates}?annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(url);
          return await res.json();
        };

        const [data1, data2] = await Promise.all([fetchBatch(batch1), fetchBatch(batch2)]);
        
        const durationsMap: Record<number, number> = {};
        const distancesMap: Record<number, number> = {};

        const processData = (data: any, batch: typeof candidates) => {
          if (data && data.code === 'Ok' && data.durations && data.distances) {
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

        // FALLBACK: If we got no results from Matrix, use straight-line distance as duration fallback
        if (Object.keys(distancesMap).length === 0) {
          batch1.forEach(c => {
            distancesMap[c.id] = c.straightDist;
            durationsMap[c.id] = c.straightDist / 1.4; // 1.4 m/s walking speed
          });
        }

        setRoadDurations(prev => ({ ...prev, ...durationsMap }));
        setRoadDistances(prev => ({ ...prev, ...distancesMap }));
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
        mapStyle={currentMapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        projection={{ name: 'globe' }}
      >
        {/* 1. TOP-LEFT: Qibla & Branding */}
        <div className="absolute top-24 left-4 z-[9999] pointer-events-none">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="pointer-events-auto"
          >
            <QiblaCompass />
          </motion.div>
        </div>

        {/* 2. TOP-CENTER: Nav Instruction Card */}
        {isNavigating && routingToMosque && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm">
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/95 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl border border-white/50 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Navigation size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider mb-0.5">Navigating To</p>
                 <h4 className="font-black text-gray-900 truncate">{getLocalizedName(routingToMosque, language)}</h4>
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Clock size={12} />
                    <span>{Math.round((routeInfo?.duration || 0) / 60)} min</span>
                    <span>•</span>
                    <span>{((routeInfo?.distance || 0) / 1000).toFixed(1)} km</span>
                 </div>
              </div>
              <button 
                onClick={() => setIsNavigating(false)}
                className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                title="End Navigation"
              >
                 <Plus size={20} className="rotate-45" />
              </button>
            </motion.div>
          </div>
        )}

        {/* 3. TOP-RIGHT: Navigation Hub (Zoom & Compass) */}
        {!isNavigating && (
          <div className={`absolute top-24 ${language === 'ar' ? 'left-4' : 'right-4'} z-[9999] flex flex-col gap-2`}>
             <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-1 flex flex-col gap-1 ring-1 ring-black/5">
                <button onClick={() => handleZoom(1)} className="p-3 hover:bg-gray-100 rounded-xl transition-colors"><Plus size={20} strokeWidth={3} /></button>
                <div className="h-px bg-gray-100 mx-2" />
                <button onClick={() => handleZoom(-1)} className="p-3 hover:bg-gray-100 rounded-xl transition-colors"><Minus size={20} strokeWidth={3} /></button>
             </div>
             
             {/* Functional Reset North */}
             <button onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: 800 })} className="p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 text-emerald-600 ring-1 ring-black/5">
                <Compass size={20} />
             </button>

             {/* Functional Near Mosque Toggle (RESTORED) */}
             <button 
               onClick={() => setShowNearest?.(!showNearest)}
               className={`p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 transition-colors ${showNearest ? 'bg-amber-500 text-white border-amber-500' : 'text-amber-600'}`}
               title={t("Nearest Mosques", language)}
             >
                <MapPin size={20} />
             </button>
          </div>
        )}

        {/* 4. BOTTOM-RIGHT: Location FAB */}
        {!isNavigating && (
          <div className={`absolute bottom-32 ${language === 'ar' ? 'left-4' : 'right-4'} z-[9999]`}>
             <button 
               onClick={handleGeolocate}
               className={`w-14 h-14 bg-white/95 backdrop-blur-xl rounded-2xl shadow-huge border border-white/50 flex items-center justify-center text-blue-600 transition-all hover:scale-105 active:scale-95 ring-1 ring-black/5 ${isLocating ? 'shadow-blue-200' : ''}`}
             >
                <LocateFixed size={24} className={isLocating ? 'animate-pulse' : ''} />
             </button>
          </div>
        )}

        {/* 5. BOTTOM-LEFT: Layers Hub */}
        {!isNavigating && (
           <div className={`absolute bottom-32 ${language === 'ar' ? 'right-4' : 'left-4'} z-[9999] flex flex-col gap-2`}>
              <button 
                onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
                className={`p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 ${mapStyle === 'satellite' ? 'text-emerald-600' : 'text-gray-700'}`}
              >
                <Layers size={20} />
              </button>
              <button 
                onClick={toggle3D}
                className={`p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 ${is3D ? 'text-indigo-600' : 'text-gray-700'}`}
              >
                <Box size={20} />
              </button>
           </div>
        )}

        {/* 3D Buildings Layer (Classic Style Implementation) */}
        {is3D && mapStyle !== 'satellite' && (
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={['==', 'extrude', 'true']}
            type="fill-extrusion"
            minzoom={15}
            paint={{
              'fill-extrusion-color': currentTheme === 'dark' ? '#334155' : '#e2e8f0',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.8
            }}
          />
        )}
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
            <UserMarkerHTML heading={navHeading} isNavigating={isNavigating} />
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
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-24 left-4 z-[10000] flex flex-col items-center gap-2"
      >
        <QiblaCompass />
      </motion.div>

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
