import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, ArrowUpDown, Compass } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Mosque } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';
import PullToRefresh from '../components/PullToRefresh';
import { cn } from '../lib/utils';

export default function SearchScreen() {
  const { mosques, favorites, setSelectedMosque, setActiveTab, language, userLocation, refreshLocation } = useAppStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>(userLocation ? 'distance' : 'name');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const types = useMemo(() => {
    const allTypes = mosques.map(m => m.type).filter(Boolean);
    return Array.from(new Set(allTypes)).sort();
  }, [mosques]);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => m.commune).filter(Boolean);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const filteredMosques = useMemo(() => {
    const lowerQuery = debouncedQuery.toLowerCase().trim();

    let filtered = mosques.filter(mosque => {
      if (selectedType && mosque.type !== selectedType) return false;
      if (selectedCommune && mosque.commune !== selectedCommune) return false;
      if (!lowerQuery) return true;

      const localizedName = getLocalizedName(mosque, language);
      return (
        localizedName.toLowerCase().includes(lowerQuery) ||
        mosque.name.toLowerCase().includes(lowerQuery) ||
        (mosque.name_ar && mosque.name_ar.toLowerCase().includes(lowerQuery)) ||
        (mosque.name_fr && mosque.name_fr.toLowerCase().includes(lowerQuery)) ||
        (mosque.name_en && mosque.name_en.toLowerCase().includes(lowerQuery)) ||
        mosque.address.toLowerCase().includes(lowerQuery) ||
        mosque.commune.toLowerCase().includes(lowerQuery)
      );
    });

    if (sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        try {
          const distA = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: a.latitude, longitude: a.longitude }
          );
          const distB = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: b.latitude, longitude: b.longitude }
          );
          return distA - distB;
        } catch (e) {
          return 0;
        }
      });
    } else {
      filtered.sort((a, b) => {
        const nameA = getLocalizedName(a, language);
        const nameB = getLocalizedName(b, language);
        return nameA.localeCompare(nameB);
      });
    }

    // Limit to 50 results to keep rendering fast and premium
    return filtered.slice(0, 50);
  }, [mosques, debouncedQuery, selectedType, selectedCommune, language, sortBy, userLocation]);

  const handleSelect = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Sticky Header with Blur */}
      <div className="z-20 px-4 pt-safe-4 pb-4 sticky top-0 border-b border-gray-200/50 bg-white/80 backdrop-blur-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('Search', language)}</h1>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold ring-1 ring-emerald-200">
            {filteredMosques.length} {t('Mosque', language)}
          </div>
        </div>

        <div className="relative mb-4 group">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
            <Search size={20} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            className={cn(
              "block w-full py-3.5 bg-gray-100/80 border-2 border-transparent rounded-[20px] leading-5 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-base font-medium transition-all shadow-sm",
              language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
            )}
            placeholder={t('Search mosques, cities...', language)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className={`flex items-center text-gray-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <Filter size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
            </div>
            <button
              onClick={() => setSelectedType(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                selectedType === null ? "bg-emerald-600 text-white shadow-emerald-glow" : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
              )}
            >
              {t('All', language)}
            </button>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                  selectedType === type ? "bg-emerald-600 text-white shadow-emerald-glow" : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t(type, language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center text-gray-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <MapPin size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
            </div>
            <button
              onClick={() => setSelectedCommune(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                selectedCommune === null ? "bg-blue-600 text-white shadow-blue-glow" : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
              )}
            >
              {t('All', language)}
            </button>
            {communes.map(commune => (
              <button
                key={commune}
                onClick={() => setSelectedCommune(commune)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                  selectedCommune === commune ? "bg-blue-600 text-white shadow-blue-glow" : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
                )}
              >
                {commune}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <PullToRefresh onRefresh={refreshLocation}>
          <div className="p-4 pb-28 space-y-4">

            {/* Sort Toggle */}
            {filteredMosques.length > 0 && userLocation && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSortBy(sortBy === 'name' ? 'distance' : 'name')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-600 transition-all active:scale-95"
                >
                  <ArrowUpDown size={14} />
                  {sortBy === 'distance' ? t('Distance', language) : t('Name', language)}
                </button>
              </div>
            )}

            {isSearching ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className="bg-white rounded-[24px] p-3 shadow-card border border-gray-100/80 flex gap-4">
                  <div className="w-24 h-24 rounded-[18px] skeleton shrink-0" />
                  <div className="flex-1 py-1 space-y-3">
                    <div className="flex justify-between">
                      <div className="w-16 h-4 skeleton rounded-full" />
                      <div className="w-12 h-4 skeleton rounded-full" />
                    </div>
                    <div className="w-3/4 h-5 skeleton rounded-full" />
                    <div className="w-full h-3 skeleton rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredMosques.map((mosque, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                    transition={{ delay: i < 15 ? i * 0.03 : 0, type: "spring", stiffness: 400, damping: 30 }}
                    key={mosque.id}
                    onClick={() => handleSelect(mosque)}
                    className="bg-white rounded-[24px] p-3 shadow-card hover:shadow-card-hover border border-gray-100/80 flex gap-4 cursor-pointer transition-all active:scale-[0.98] group relative"
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
                      <div className="absolute inset-0 rounded-[18px] ring-1 ring-inset ring-black/10"></div>
                      {favorites.includes(mosque.id) && (
                        <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-md z-10">
                          <Heart size={14} className="fill-red-500 text-red-500" />
                        </div>
                      )}
                    </div>

                    <div className={`flex-1 flex flex-col justify-center ${language === 'ar' ? 'pl-1' : 'pr-1'} min-w-0`}>
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">{t(mosque.type, language)}</div>
                        <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">{mosque.commune}</div>
                      </div>

                      <h3 className="font-black text-gray-900 leading-tight mb-2 line-clamp-2 text-base group-hover:text-emerald-700 transition-colors">
                        {mosque.name}
                      </h3>

                      <div className="flex items-center justify-between mt-auto gap-2">
                        <div className="flex items-start text-gray-500 text-xs truncate">
                          <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} shrink-0 text-gray-400`} />
                          <span className="truncate font-medium">{t(mosque.address, language)}</span>
                        </div>

                        {userLocation && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
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
              </AnimatePresence>
            )}

            {!isSearching && filteredMosques.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 px-4"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{t('No mosques found', language)}</h3>
                <p className="text-gray-500 text-sm font-medium">{t('Try adjusting your search or filters', language)}</p>
              </motion.div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
