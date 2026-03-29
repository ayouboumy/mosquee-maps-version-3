import { motion } from 'motion/react';
import { 
  ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, 
  Clipboard, Check, Share2, Building2, Users, Maximize, 
  Home, Droplets, Info, Activity, Clock, ShieldCheck,
  Compass, FileText, Globe, XCircle
} from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t, getLocalizedName } from '../utils/translations';
import { useState, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MiniMapHTMLIcon = () => (
  <div className="relative flex items-center justify-center pointer-events-none">
    <div style={{
      width: '30px', height: '30px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '50% 50% 50% 0',
      transform: 'rotate(-45deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
      border: '2px solid white'
    }}>
      <div style={{ transform: 'rotate(45deg)', paddingTop: '1px', paddingLeft: '1px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
    </div>
  </div>
);

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite, language, routeProfile, userLocation, setRoutingToMosque, mapStyle } = useAppStore();
  const [copied, setCopied] = useState(false);
  const isFavorite = favorites.includes(mosque.id);

  const handleCopyPosition = () => {
    const coords = `${mosque.latitude}, ${mosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mosque.name,
          text: `${mosque.name} - ${mosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleStartRoute = () => {
    setRoutingToMosque(mosque);
    onClose();
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  function formatDisplayNumber(val: any) {
    if (typeof val === 'number') {
      return new Intl.NumberFormat().format(val);
    }
    const parsed = Number(val);
    if (!isNaN(parsed) && val.trim?.() !== '') {
      return new Intl.NumberFormat().format(parsed);
    }
    return val;
  }

  // Intelligent Data Organization
  const { organizedData, highlights, adminData, openingStatus } = useMemo(() => {
    const highlightsList: { label: string; value: string; icon: any; color: string }[] = [];
    const adminHierarchy: { key: string; value: string }[] = [];
    let opening: string | null = null;
    
    if (!mosque.extraData) return { organizedData: [], highlights: [], adminData: [], openingStatus: null };

    const categories = [
      {
        id: 'capacity',
        title: t('Capacity & Space', language),
        icon: Maximize,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        keys: ['capacité', 'surface', 'aire', 'm2', 'place', 'nombre de fidèles', 'superficie'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'prayer',
        title: t('Prayer Areas', language),
        icon: Users,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        keys: ['femme', 'homme', 'salle', 'prière', 'étage', 'mezzanine', 'prier'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'sanitary',
        title: t('Sanitary Facilities', language),
        icon: Droplets,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        keys: ['eau', 'électricité', 'sanitaire', 'latrine', 'toilette', 'abdest', 'puits', 'compteur', 'robinet', 'lavabo', 'bassin', 'fontaine'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'status',
        title: t('Status & Foundation', language),
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        keys: ['construction', 'date', 'terrain', 'titre', 'foncier', 'clôture', 'urbain', 'rural', 'صومعة', 'état', 'condition'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'staff',
        title: t('Staff & Housing', language),
        icon: Home,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        keys: ['logement', 'imam', 'mouadhine', 'mouadine', 'gardien', 'fquih', 'imamat'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'finances',
        title: t('Administration & Finance', language),
        icon: FileText,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        keys: ['entité', 'financement', 'ministère', 'habous', 'nidhara', 'awqaf', 'association', 'bienfaiteur'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'other',
        title: t('Other Details', language),
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        keys: [],
        items: [] as { key: string; value: any }[]
      }
    ];

    const administrativeKeys = ['région', 'province', 'préfecture', 'caïdat', 'commune', 'milieu', 'cercle'];

    // Deep Analysis for Highlights and Categorization
    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      let valStr = String(value).trim();

      // Handle Truthy/Falsy visually
      if (['oui', 'yes', 'true', 'vrai', '✅'].includes(valStr.toLowerCase())) {
        valStr = 'BOOLEAN_TRUE';
      } else if (['non', 'no', 'false', 'faux', '❌'].includes(valStr.toLowerCase())) {
        valStr = 'BOOLEAN_FALSE';
      }

      // Format Numbers
      if (valStr !== 'BOOLEAN_TRUE' && valStr !== 'BOOLEAN_FALSE') {
          valStr = formatDisplayNumber(valStr);
      }

      // Administrative extraction (Région, Province, etc)
      let isAdmin = false;
      for (let adminKey of administrativeKeys) {
        if (lowerKey.includes(adminKey)) {
          adminHierarchy.push({ key, value: valStr });
          isAdmin = true;
          break;
        }
      }
      if (isAdmin) return;

      // Extract Opening Status
      if (lowerKey.includes('ouvert') || lowerKey.includes('fermé') || lowerKey.includes('statut d\'ouverture')) {
        opening = String(value);
        return;
      }

      // Extract highlights...
      if ((lowerKey.includes('capacité') || lowerKey.includes('nombre de fidèles') || lowerKey.includes('capacity')) && !highlightsList.find(h => h.label === 'Capacity')) {
        highlightsList.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
        return;
      }
      if ((lowerKey.includes('surface') || lowerKey.includes('superficie')) && !highlightsList.find(h => h.label === 'Surface')) {
        highlightsList.push({ label: 'Surface', value: valStr, icon: Maximize, color: 'blue' });
        return;
      }
      if ((lowerKey.includes('état') || lowerKey.includes('condition')) && !highlightsList.find(h => h.label === 'Condition')) {
        highlightsList.push({ label: 'Condition', value: String(value), icon: Activity, color: 'amber' });
        return;
      }

      // Filter out redundant coordinate data since we map it
      if (['x', 'y', 'latitude', 'longitude', 'lat', 'lng', 'coordonnées', 'coordonnees'].includes(lowerKey)) {
          return;
      }

      let found = false;
      for (const cat of categories) {
        if (cat.keys.some(k => lowerKey.includes(k))) {
          cat.items.push({ key, value: valStr });
          found = true;
          break;
        }
      }
      if (!found && valStr !== '') {
        categories.find(c => c.id === 'other')?.items.push({ key, value: valStr });
      }
    });

    return { 
      organizedData: categories.filter(cat => cat.items.length > 0),
      highlights: highlightsList,
      adminData: adminHierarchy,
      openingStatus: opening
    };
  }, [mosque.extraData, language]);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-gray-50 overflow-y-auto"
    >
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[350px]">
        {mosque.image ? (
          <img 
            src={mosque.image} 
            alt={getLocalizedName(mosque, language)} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center">
            <Compass size={64} className="text-emerald-500/30" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        
        <button 
          onClick={onClose}
          className={`absolute top-safe-4 ${language === 'ar' ? 'right-4' : 'left-4'} p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all border border-white/20 z-10 active:scale-90`}
        >
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="absolute bottom-6 left-5 right-5 text-white z-10">
           {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {t(mosque.type, language)}
            </motion.div>

            {openingStatus && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "px-3 py-1 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg flex items-center gap-1.5",
                  openingStatus.toLowerCase().includes('ouvert') 
                    ? "bg-blue-500/90 shadow-blue-900/30" 
                    : "bg-red-500/90 shadow-red-900/30"
                )}
              >
                <Clock size={14} />
                {openingStatus}
              </motion.div>
            )}
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-serif font-black mb-2 leading-[1.1] tracking-tight drop-shadow-xl"
          >
            {getLocalizedName(mosque, language)}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start text-white/90 text-sm font-medium"
          >
            <MapPin size={16} className={cn("shrink-0 mt-0.5", language === 'ar' ? 'ml-2' : 'mr-2 text-gray-300')} />
            <span className="leading-snug line-clamp-2">{t(mosque.address, language)}</span>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 px-4 sm:px-6 pb-24 -mt-4">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-[24px] p-2 shadow-bottom-sheet flex items-center justify-end mb-6 border border-white/50"
        >
          <div className="flex gap-2 px-2 shrink-0">
            <button 
              onClick={() => toggleFavorite(mosque.id)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90",
                isFavorite ? "bg-red-50 text-red-500 shadow-sm" : "bg-gray-100/80 text-gray-500 hover:bg-gray-200"
              )}
            >
              <Heart size={22} className={cn(isFavorite && "fill-current")} />
            </button>
            <button 
              onClick={handleShare}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100/80 text-gray-700 hover:bg-gray-200 transition-all active:scale-90"
            >
              <Share2 size={20} />
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Mini Map Preview */}
          {mosque.latitude && mosque.longitude && (
            <section className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
              <div className="h-32 w-full relative z-0 pointer-events-none">
                <Map 
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{
                    longitude: mosque.longitude,
                    latitude: mosque.latitude,
                    zoom: 15
                  }}
                  mapStyle={mapStyle === 'street' ? "mapbox://styles/mapbox/streets-v12" : "mapbox://styles/mapbox/satellite-v9"}
                  interactive={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker longitude={mosque.longitude} latitude={mosque.latitude} anchor="bottom">
                    <MiniMapHTMLIcon />
                  </Marker>
                </Map>
              </div>
              <div className="p-3 bg-white flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {mosque.latitude.toFixed(5)}, {mosque.longitude.toFixed(5)}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleOpenGoogleMapsRoute} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-[10px] text-xs font-bold transition-colors">
                    Maps
                  </button>
                  <button onClick={handleCopyPosition} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-[10px] text-xs font-bold text-gray-600 transition-colors">
                    {copied ? t('Copied', language) : t('Copy', language)}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Key Highlights Grid */}
          {highlights.length > 0 && (
            <section className="grid grid-cols-2 gap-3">
              {highlights.map((h, idx) => (
                <div key={idx} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-start gap-3">
                  <div className={cn("p-2.5 rounded-xl shrink-0", `bg-${h.color}-50 text-${h.color}-600`)}>
                    <h.icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-0.5">{t(h.label, language)}</p>
                    <p className="text-base font-black text-gray-900 truncate" title={String(h.value)}>{h.value}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Administrative Data Block */}
          {adminData.length > 0 && (
            <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/30 flex items-center gap-3">
                 <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
                  <Globe size={18} />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">{t('Administrative Hierarchy', language)}</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-6">
                 {adminData.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                       <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 mb-1">{t(item.key, language)}</span>
                       <span className="text-sm font-bold text-gray-800">{t(item.value, language)}</span>
                    </div>
                 ))}
              </div>
            </section>
          )}

          {/* Intelligent Data Rows */}
          {organizedData.map(cat => (
            <section key={cat.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                 <div className={cn("p-2 rounded-xl shrink-0", cat.bgColor, cat.color)}>
                  <cat.icon size={18} />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">{cat.title}</h2>
              </div>
              <div className="p-2 gap-0.5 flex flex-col">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <span className="text-xs font-bold text-gray-500 max-w-[45%] leading-relaxed">{t(item.key, language)}</span>
                    {item.value === 'BOOLEAN_TRUE' ? (
                       <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-100 shrink-0" />
                    ) : item.value === 'BOOLEAN_FALSE' ? (
                       <XCircle size={20} className="text-red-500 fill-red-100 shrink-0" />
                    ) : (
                       <span className="text-sm font-medium text-gray-900 text-right max-w-[50%]">{t(String(item.value), language)}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Facilities and Services Chips */}
          <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">{t('Services & Facilities', language)}</h2>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {mosque.services.map(service => (
                <div key={service} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100/50 rounded-full text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-100" />
                  {t(service, language)}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {mosque.items.map(item => (
                <div key={item} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider rounded-[10px] border border-gray-200/50">
                  {t(item, language)}
                </div>
              ))}
              {mosque.services.length === 0 && mosque.items.length === 0 && (
                <p className="text-sm text-gray-400 italic font-medium w-full text-center py-2">{t('No specific facilities listed', language)}</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
}
