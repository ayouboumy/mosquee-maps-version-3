import { useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from './store/useAppStore';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import { LocateFixed, MapPin, Layers } from 'lucide-react';
import MapView from './components/MapView';
import { t } from './utils/translations';
import DirectionsPanel from './components/DirectionsPanel';
import PullToRefresh from './components/PullToRefresh';

export default function App() {
  const { activeTab, setUserLocation, language, routingToMosque, refreshLocation, mosques, mapStyle, setMapStyle, isNavigating } = useAppStore();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearest, setShowNearest] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(t("Location access denied or unavailable.", language));
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError(t("Geolocation is not supported by your browser.", language));
      setIsLocating(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-gray-100 overflow-hidden font-sans text-gray-900 flex justify-center"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile container constraint for desktop viewing */}
      <div className="w-full max-w-md h-full bg-white relative shadow-2xl overflow-hidden flex flex-col">

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <PullToRefresh onRefresh={refreshLocation}>
              <MapView 
                showNearest={showNearest} 
                setShowNearest={setShowNearest} 
                isLocating={isLocating}
                setIsLocating={setIsLocating}
              />

              {locationError && (
                <div className="absolute top-safe-20 left-4 right-4 z-[1000] p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl shadow-sm">
                  {locationError}
                </div>
              )}

              {!isNavigating && <BottomSheet />}
              {!isNavigating && <DirectionsPanel />}
            </PullToRefresh>
          )}

          {activeTab === 'search' && <SearchScreen />}

          {activeTab === 'favorites' && <FavoritesScreen />}

          {activeTab === 'settings' && <SettingsScreen />}
        </div>

        {!routingToMosque && !isNavigating && <BottomNav />}
      </div>
    </div>
  );
}
