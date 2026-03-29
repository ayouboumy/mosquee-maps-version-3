import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Navigation, Heart, Info, Map, Route, Share2, Phone, Clock, MapPin, Clipboard, Check, Map as MapIcon, Compass, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { useState, useMemo, useEffect } from 'react';
import ProfileScreen from '../screens/ProfileScreen';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';

export default function BottomSheet() {
  const { mosques, selectedMosque, setSelectedMosque, favorites, toggleFavorite, language, setRoutingToMosque, userLocation, routeInfo, routingToMosque, routeProfile } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);

  const KAABA = { lat: 21.4225, lng: 39.8262 };

  const dragControls = useDragControls();

  const isRoutingToThis = routingToMosque?.id === selectedMosque?.id;

  // Fetch road distance when a mosque is selected
  useEffect(() => {
    if (!selectedMosque || !userLocation) {
      setRoadDistance(null);
      return;
    }

    const abortController = new AbortController();
    const fetchDistance = async () => {
      try {
        const profile = (routeProfile || 'foot') === 'foot' ? 'foot' : 'driving';
        const baseUrl = profile === 'foot'
          ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
          : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';

        const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${selectedMosque.longitude},${selectedMosque.latitude}?overview=false&alternatives=true`, {
          signal: abortController.signal
        });
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          setRoadDistance(data.routes[0].distance);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching road distance for bottom sheet:", error);
        }
      }
    };

    fetchDistance();
    return () => { abortController.abort(); };
  }, [selectedMosque, userLocation, routeProfile]);

  const distance = useMemo(() => {
    if (!userLocation || !selectedMosque) return null;
    if (isRoutingToThis && routeInfo) return (routeInfo.distance / 1000).toFixed(1);
    if (roadDistance !== null) return (roadDistance / 1000).toFixed(1);
    try {
      return (getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: selectedMosque.latitude, longitude: selectedMosque.longitude }
      ) / 1000).toFixed(1);
    } catch (e) {
      return null;
    }
  }, [userLocation, selectedMosque, isRoutingToThis, routeInfo, roadDistance]);

  const qiblaAngle = useMemo(() => {
    if (!selectedMosque) return null;
    const lat1 = (selectedMosque.latitude * Math.PI) / 180;
    const lng1 = (selectedMosque.longitude * Math.PI) / 180;
    const lat2 = (KAABA.lat * Math.PI) / 180;
    const lng2 = (KAABA.lng * Math.PI) / 180;

    const y = Math.sin(lng2 - lng1);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lng2 - lng1);
    const qiblaRad = Math.atan2(y, x);
    return Math.round(((qiblaRad * 180) / Math.PI + 360) % 360);
  }, [selectedMosque]);

  const nearbyMosques = useMemo(() => {
    if (!selectedMosque) return [];
    return mosques
      .filter(m => m.id !== selectedMosque.id)
      .map(m => {
        let distanceToSelected = Infinity;
        try {
          distanceToSelected = getDistance(
            { latitude: selectedMosque.latitude, longitude: selectedMosque.longitude },
            { latitude: m.latitude, longitude: m.longitude }
          );
        } catch (e) { }
        return { ...m, distanceToSelected };
      })
      .sort((a, b) => a.distanceToSelected - b.distanceToSelected)
      .slice(0, 3);
  }, [mosques, selectedMosque]);

  // If we are actively routing to this mosque, do not show the bottom sheet to prevent UI overlap
  if (!selectedMosque || routingToMosque?.id === selectedMosque.id) return null;

  const isFavorite = favorites.includes(selectedMosque.id);

  const handleCopyPosition = () => {
    const coords = `${selectedMosque.latitude}, ${selectedMosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedMosque.latitude},${selectedMosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.latitude},${selectedMosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedMosque.name,
          text: `${selectedMosque.name} - ${selectedMosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${selectedMosque.latitude},${selectedMosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 3000);
  };

  return (
    <>
      <AnimatePresence>
        {selectedMosque && !showProfile && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.05}
            onDragEnd={(e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) {
                setSelectedMosque(null);
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-bottom-sheet max-w-md mx-auto pb-safe border-t border-white/50"
          >
            {/* Drag Handle */}
            <div
              className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-gray-300/80 rounded-full" />
            </div>

            <div className="px-5 pb-6 pt-1 max-h-[85vh] overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{selectedMosque.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-sm">
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{t(selectedMosque.type, language)}</span>
                    {distance && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600 font-medium">
                          {distance} km {roadDistance !== null || (isRoutingToThis && routeInfo) ? `(${t('Road', language)})` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMosque(null)}
                  className="p-2 bg-gray-100/80 rounded-full hover:bg-gray-200 transition-colors shrink-0 mt-1 active:scale-90"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Quick Actions (Horizontal Scroll) */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-5 px-5">
                <button
                  onClick={() => setRoutingToMosque(selectedMosque)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shrink-0 shadow-lg shadow-emerald-600/20 active:scale-95 group"
                >
                  <Navigation size={18} className="fill-current group-hover:translate-x-0.5 transition-transform" />
                  {t('Route', language)}
                </button>
                <button
                  onClick={handleOpenGoogleMapsRoute}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-full font-bold hover:bg-blue-100 transition-colors shrink-0 border border-blue-100/50"
                >
                  <MapIcon size={18} />
                  {t('Google Maps', language)}
                </button>
                <button
                  onClick={() => toggleFavorite(selectedMosque.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full font-bold transition-all shrink-0 border group",
                    isFavorite
                      ? "bg-red-50 text-red-600 border-red-100 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200/60 hover:bg-gray-100"
                  )}
                >
                  <Heart size={18} className={cn("group-hover:scale-110 transition-transform", isFavorite && "fill-current")} />
                  {t('Save', language)}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200/60 text-gray-700 rounded-full font-bold hover:bg-gray-100 transition-all shrink-0 active:scale-95"
                >
                  <Share2 size={18} />
                  {t('Share', language)}
                </button>
              </div>

              {/* Image & Info Grid */}
              <div className="mt-3 flex gap-4">
                <div className="relative shrink-0">
                  <img
                    src={selectedMosque.image}
                    alt={getLocalizedName(selectedMosque, language)}
                    loading="lazy"
                    className="w-28 h-28 rounded-[20px] object-cover shadow-sm"
                  />
                  <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-black/10"></div>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2.5">
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="line-clamp-2 leading-snug font-medium text-gray-700">{t(selectedMosque.address, language)}</span>
                      {selectedMosque.commune && (
                        <span className="text-xs font-semibold text-emerald-600/80 mt-1">{selectedMosque.commune}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Services Preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMosque.services.slice(0, 3).map(service => (
                      <span key={service} className="px-2 py-1 bg-gray-100/80 text-gray-600 text-[10px] font-bold rounded-md border border-gray-200/50">
                        {t(service, language)}
                      </span>
                    ))}
                    {selectedMosque.services.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100/50 text-gray-500 text-[10px] font-bold rounded-md">
                        +{selectedMosque.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Qibla & Accuracy Info */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                    <Compass size={14} />
                    Qibla
                  </div>
                  <div className="text-lg font-black text-emerald-900">{qiblaAngle}° <span className="text-[10px] font-bold text-emerald-600/60 uppercase">NNE</span></div>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                    <MapPin size={14} />
                    Accuracy
                  </div>
                  <div className="text-lg font-black text-blue-900">100% <span className="text-[10px] font-bold text-blue-600/60 uppercase">Matrix</span></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <button
                  onClick={() => setShowProfile(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50/80 text-gray-800 rounded-2xl font-bold hover:bg-gray-100 hover:shadow-sm transition-all border border-gray-200/50 active:scale-[0.98]"
                >
                  <Info size={18} className="text-gray-500" />
                  {t('View Full Details', language)}
                </button>
                
                <button
                  onClick={handleReport}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all border active:scale-[0.98]",
                    reported 
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {reported ? (
                    <>
                      <Check size={18} />
                      {t('Report Sent', language)}
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} />
                      {t('Report an Issue', language)}
                    </>
                  )}
                </button>
              </div>

              {/* Nearby Mosques */}
              {nearbyMosques.length > 0 && (
                <div className="mt-6 pt-5">
                  <h4 className="text-sm font-black text-gray-900 mb-3 px-1 uppercase tracking-wider text-gray-400">{t('Nearby Mosques', language)}</h4>
                  <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-5 px-5">
                    {nearbyMosques.map(mosque => (
                      <button
                        key={mosque.id}
                        onClick={() => setSelectedMosque(mosque)}
                        className="flex flex-col gap-2 p-2 bg-white rounded-[20px] min-w-[140px] max-w-[140px] text-left hover:shadow-card-hover shadow-card transition-all border border-gray-100 shrink-0 group active:scale-95"
                      >
                        <div className="relative w-full h-24 overflow-hidden rounded-[16px]">
                          <img
                            src={mosque.image}
                            loading="lazy"
                            alt={getLocalizedName(mosque, language)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                          <div className="absolute bottom-2 left-2 right-2 text-white">
                            <h5 className="font-bold text-xs line-clamp-1 drop-shadow-md">{mosque.name}</h5>
                          </div>
                        </div>
                        <div className="px-1.5 pb-1 flex items-center gap-1 mt-0.5 text-[11px] font-medium text-gray-500">
                          <Compass size={12} className="shrink-0 text-emerald-500" />
                          <span>{(mosque.distanceToSelected / 1000).toFixed(1)} km</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <ProfileScreen
            mosque={selectedMosque}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
