import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Footprints, MapPin, Car, ArrowLeft, Dot, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

// Animated counter component
function AnimatedCounter({ value, label }: { value: number, label: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(Math.round(start + (end - start) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
}

export default function DirectionsPanel() {
  const { routingToMosque, routeInfo, setRoutingToMosque, language, routeProfile, setRouteProfile, setIsNavigating } = useAppStore();

  const handleOpenMaps = () => {
    if (!routingToMosque) return;
    const travelMode = routeProfile === 'driving' ? 'driving' : 'walking';
    // Using intent URLs for better mobile experience if available, fallback to universal
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${routingToMosque.latitude},${routingToMosque.longitude}&travelmode=${travelMode}`, '_blank');
  };

  const getDurationParts = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return { min: minutes, h: 0 };
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return { min: remainingMinutes, h: hours };
  };

  return (
    <AnimatePresence>
      {routingToMosque && (
        <>
          {/* TOP BAR: Origin & Destination */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-safe-4 left-4 right-4 z-[1001] bg-white/90 backdrop-blur-xl rounded-[24px] shadow-card p-3 border border-white/60"
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => setRoutingToMosque(null)}
                className="mt-2.5 p-3 rounded-[16px] transition-all active:scale-90 bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 shadow-sm"
              >
                <X size={22} />
              </button>

              <div className="flex-1 flex flex-col gap-3 relative py-1">
                {/* Connecting Line */}
                <div className="absolute left-[11px] top-[26px] bottom-[26px] w-[2px] bg-gradient-to-b from-blue-300 to-red-300 opacity-60 rounded-full" />

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  </div>
                  <div className="bg-gray-50/80 rounded-xl px-4 py-3 flex-1 text-sm text-gray-500 font-medium border border-gray-100">
                    {t('Your Location', language)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
                    <MapPin size={16} className="text-red-600" fill="#ef4444" stroke="white" strokeWidth={2} />
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3 flex-1 text-sm text-gray-900 font-bold border border-gray-200 shadow-sm truncate">
                    {routingToMosque.name}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM SHEET: Travel Modes & Start */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-[1001] bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-bottom-sheet pb-safe border-t border-white/50"
          >
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300/80 rounded-full" />
            </div>

            <div className="px-6 pb-6 pt-2">
              {/* Travel Modes */}
              <div className="flex gap-4 mb-6 relative">
                <button
                  onClick={() => setRouteProfile('driving')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] transition-all relative overflow-hidden",
                    routeProfile === 'driving'
                      ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_2px_#3b82f6]"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-transparent"
                  )}
                >
                  <Car size={26} className={routeProfile === 'driving' ? "text-blue-600" : ""} />
                  <span className="text-sm font-bold">{t('Driving', language)}</span>
                  {routeProfile === 'driving' && (
                    <motion.div layoutId="profile-indicator" className="absolute inset-0 bg-blue-500/5" />
                  )}
                </button>
                <button
                  onClick={() => setRouteProfile('foot')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] transition-all relative overflow-hidden",
                    routeProfile === 'foot'
                      ? "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_2px_#10b981]"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-transparent"
                  )}
                >
                  <Footprints size={26} className={routeProfile === 'foot' ? "text-emerald-600" : ""} />
                  <span className="text-sm font-bold">{t('Walking', language)}</span>
                  {routeProfile === 'foot' && (
                    <motion.div layoutId="profile-indicator" className="absolute inset-0 bg-emerald-500/5" />
                  )}
                </button>
              </div>

              {/* Route Info & Start Button */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {routeInfo ? (
                    <>
                      <div className={cn(
                        "text-4xl font-black tracking-tighter flex items-baseline gap-1",
                        routeProfile === 'driving' ? 'text-blue-600 shadow-blue-glow' : 'text-emerald-600 shadow-emerald-glow'
                      )}>
                        {getDurationParts(routeInfo.duration).h > 0 && (
                          <>
                            <AnimatedCounter value={getDurationParts(routeInfo.duration).h} label="h" />
                            <span className="text-xl font-bold opacity-70">h</span>
                          </>
                        )}
                        <AnimatedCounter value={getDurationParts(routeInfo.duration).min} label="min" />
                        <span className="text-xl font-bold opacity-70">min</span>
                      </div>
                      <div className="text-gray-500 font-bold mt-1 tracking-wide text-sm flex items-center gap-1.5">
                        <span className="opacity-80">
                          {Number((routeInfo.distance / 1000).toFixed(1))} km
                        </span>
                        <Dot size={16} className="opacity-50" />
                        <span className="opacity-80">
                          {routeProfile === 'driving' ? t('Fastest route', language) : t('Mostly flat', language)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="pl-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsNavigating(true)}
                      disabled={!routeInfo}
                      className={cn(
                        "flex items-center justify-center gap-2 text-white h-[50px] px-8 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                        !routeInfo
                          ? "bg-gray-300 shadow-none pointer-events-none opacity-50"
                          : routeProfile === 'driving'
                            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 ring-4 ring-blue-600/10"
                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-4 ring-emerald-600/10"
                      )}
                    >
                      <Navigation size={18} className="fill-current" />
                      {t('Start 3D Nav', language)}
                    </button>
                    <button
                      onClick={handleOpenMaps}
                      disabled={!routeInfo}
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors text-center"
                    >
                      {t('Open in External Maps', language)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
