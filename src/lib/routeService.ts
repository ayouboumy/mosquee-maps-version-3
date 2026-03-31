import { get, set } from 'idb-keyval';

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN;

export interface RouteResponse {
  distance: number;
  duration: number;
  geometry: any;
  steps: any[];
}

/**
 * Fetches routing data with persistent caching to minimize API usage.
 */
export async function getCachedRoute(
  start: [number, number],
  end: [number, number],
  profile: 'driving' | 'walking' = 'driving'
): Promise<RouteResponse | null> {
  // Accuracy: Round coordinates to 5 decimal places (~1.1m) to improve cache hits
  const precision = 5;
  const sLon = start[0].toFixed(precision);
  const sLat = start[1].toFixed(precision);
  const eLon = end[0].toFixed(precision);
  const eLat = end[1].toFixed(precision);
  const cacheKey = `route_${profile}_${sLon},${sLat}_${eLon},${eLat}`;

  try {
    // Check IndexedDB cache first
    const cached = await get(cacheKey);
    if (cached) {
      console.log('🔄 Route retrieved from cache:', cacheKey);
      return cached;
    }

    // Fetch from Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&steps=true&banner_instructions=true&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const result: RouteResponse = {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        steps: route.legs[0].steps || []
      };

      // Store in persistent cache
      await set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.error('❌ Route fetch error:', error);
  }

  return null;
}
