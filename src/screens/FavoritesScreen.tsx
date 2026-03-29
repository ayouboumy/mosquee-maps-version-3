import { Heart, MapPin, Compass } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { t, getLocalizedName } from '../utils/translations';
import PullToRefresh from '../components/PullToRefresh';
import { getDistance } from 'geolib';

export default function FavoritesScreen() {
  const { mosques, favorites, setSelectedMosque, setActiveTab, language, refreshLocation, userLocation } = useAppStore();

  const favoriteMosques = mosques.filter(m => favorites.includes(m.id));

  const handleSelect = (mosque: any) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="z-20 px-4 pt-safe-4 pb-4 sticky top-0 border-b border-gray-200/50 bg-white/80 backdrop-blur-2xl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('Saved Mosques', language)}</h1>
          <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[11px] font-bold ring-1 ring-rose-200 flex items-center gap-1.5">
            <Heart size={12} className="fill-current" />
            {favoriteMosques.length}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <PullToRefresh onRefresh={refreshLocation}>
          <div className="p-4 pb-28">
            <AnimatePresence mode="popLayout">
              {favoriteMosques.length > 0 ? (
                <div className="space-y-4">
                  {favoriteMosques.map((mosque, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
                      key={mosque.id}
                      onClick={() => handleSelect(mosque)}
                      className="bg-white rounded-[24px] p-3 shadow-card hover:shadow-card-hover border border-gray-100 flex gap-4 cursor-pointer transition-all active:scale-[0.98] group relative"
                    >
                      <div className="relative shrink-0 w-24 h-24">
                        {mosque.image ? (
                          <img
                            src={mosque.image}
                            loading="lazy"
                            alt={getLocalizedName(mosque, language)}
                            className="w-full h-full rounded-[18px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-[18px] bg-gray-100 flex items-center justify-center">
                            <Compass size={24} className="text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[18px]"></div>
                        <div className="absolute inset-0 rounded-[18px] ring-1 ring-inset ring-black/10"></div>
                        <div className="absolute top-2 right-2 p-1.5 bg-white/40 backdrop-blur-md rounded-full shadow-sm text-white hover:text-red-500 hover:bg-white transition-all z-10">
                          <Heart size={16} className="fill-red-500 text-red-500" />
                        </div>
                      </div>

                      <div className={`flex-1 flex flex-col justify-center ${language === 'ar' ? 'pl-1' : 'pr-1'} min-w-0`}>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest truncate">{t(mosque.type, language)}</div>
                          <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">{mosque.commune}</div>
                        </div>

                        <h3 className="font-black text-gray-900 leading-tight mb-2 line-clamp-2 text-base group-hover:text-rose-600 transition-colors">
                          {mosque.name}
                        </h3>

                        <div className="flex items-center justify-between mt-auto gap-2">
                          <div className="flex items-start text-gray-500 text-xs truncate">
                            <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} shrink-0 text-gray-400`} />
                            <span className="truncate font-medium">{t(mosque.address, language)}</span>
                          </div>

                          {userLocation && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg shrink-0">
                              <Compass size={12} />
                              {(() => {
                                try {
                                  return (getDistance(
                                    { latitude: userLocation.latitude, longitude: userLocation.longitude },
                                    { latitude: mosque.latitude, longitude: mosque.longitude }
                                  ) / 1000).toFixed(1) + ' km';
                                } catch (e) {
                                  return '';
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 px-6"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-rose-100">
                    <Heart size={40} className="text-rose-400 fill-rose-100" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{t('No favorites yet', language)}</h3>
                  <p className="text-gray-500 mb-8 max-w-[260px] mx-auto font-medium leading-relaxed">
                    {t('Save your favorite mosques to quickly access them later, even offline.', language)}
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold shadow-xl shadow-gray-900/20 hover:scale-105 transition-all active:scale-95"
                  >
                    {t('Explore Mosques', language)}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
