import { Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet, Globe, Loader2, MapPin, Footprints, Car, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { useRef, useState, ChangeEvent, useMemo } from 'react';
import { useAppStore, Language } from '../store/useAppStore';
import * as XLSX from 'xlsx';
import { t } from '../utils/translations';
import { translateTerms } from '../utils/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function SettingsScreen() {
  const { mosques, importMosques, language, setLanguage, addDynamicTranslations, selectedCommune, setSelectedCommune, routeProfile, setRouteProfile, mapTheme, setMapTheme } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => m.commune);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const processFile = async (file: File) => {
    setStatus({ type: 'info', message: t('Parsing Excel file...', language) });
    setIsTranslating(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      setTimeout(async () => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          let parsed = XLSX.utils.sheet_to_json(worksheet);
          
          if (parsed.length > 0 && Object.keys(parsed[0] as object).length === 1) {
            const firstKey = Object.keys(parsed[0] as object)[0];
            if (firstKey.includes(';')) {
              const headers = firstKey.split(';');
              parsed = parsed.map((row: any) => {
                const values = String(row[firstKey]).split(';');
                const newRow: any = {};
                headers.forEach((header, i) => {
                  newRow[header] = values[i];
                });
                return newRow;
              });
            }
          }
        
        if (Array.isArray(parsed)) {
          const formattedMosques = parsed.map((item: any, index: number) => {
            const getVal = (keys: string[]) => {
              const foundKey = Object.keys(item).find(k => keys.includes(k.toLowerCase().trim()));
              return foundKey ? item[foundKey] : undefined;
            };

            const id = getVal(['id']) || index + 1;
            const name_ar = getVal(['dénomination_en_arabe', 'denomination_en_arabe', 'dénomination en arabe', 'denomination en arabe', 'name_ar', 'name ar', 'اسم المسجد']);
            const name_fr = getVal(['dénomination_en_français', 'denomination_en_francais', 'dénomination en français', 'denomination en francais', 'name_fr', 'name fr']);
            const name_en = getVal(['dénomination_en_anglais', 'denomination_en_anglais', 'dénomination en anglais', 'denomination en anglais', 'name_en', 'name en']);
            const genericName = getVal(['nom', 'dénomination', 'denomination', 'name', 'mosque name', 'mosque', 'اسم المسجد']);
            const name = genericName || name_fr || name_ar || name_en || 'Unknown Mosque';
            const latitude = Number(getVal(['latitude', 'lat'])) || 0;
            const longitude = Number(getVal(['longitude', 'lng', 'long'])) || 0;
            const address = getVal(['address', 'adresse', 'location', 'city', 'emplacement', 'lieu', 'العنوان', 'الموقع', 'المدينة']) || 'Unknown Address';
            const rawCommune = getVal(['commune', 'municipality', 'district', 'commune_ar', 'commune_fr', 'ville', 'city', 'الجماعة', 'المقاطعة', 'العمالة']);
            const commune = rawCommune ? String(rawCommune).trim() : (address !== 'Unknown Address' ? (address.split(',')[0] || 'Unknown').trim() : 'Unknown');
            const type = getVal(['type', 'category', 'catégorie', 'genre', 'النوع', 'الصنف']) || 'Mosque';
            const servicesRaw = getVal(['services', 'facilities', 'équipements', 'equipements', 'الخدمات', 'المرافق']);
            const itemsRaw = getVal(['items', 'amenities', 'features', 'articles', 'composants', 'العناصر', 'المكونات']);
            const image = getVal(['image', 'photo', 'picture', 'image_url', 'url_image', 'الصورة']) || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1000';

            const parseArray = (val: any) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return [];
            };

            const standardKeys = ['id', 'dénomination_en_arabe', 'denomination_en_arabe', 'dénomination en arabe', 'denomination en arabe', 'dénomination_en_français', 'denomination_en_francais', 'dénomination en français', 'denomination en francais', 'dénomination_en_anglais', 'denomination_en_anglais', 'dénomination en anglais', 'denomination en anglais', 'name_ar', 'name ar', 'name_fr', 'name fr', 'name_en', 'name en', 'name', 'mosque name', 'mosque', 'nom', 'dénomination', 'denomination', 'latitude', 'lat', 'longitude', 'lng', 'long', 'address', 'adresse', 'location', 'city', 'emplacement', 'lieu', 'العنوان', 'الموقع', 'المدينة', 'type', 'category', 'catégorie', 'genre', 'النوع', 'الصنف', 'services', 'facilities', 'équipements', 'equipements', 'الخدمات', 'المرافق', 'items', 'amenities', 'features', 'articles', 'composants', 'العناصر', 'المكونات', 'image', 'photo', 'picture', 'image_url', 'url_image', 'الصورة', 'commune', 'municipality', 'district', 'commune_ar', 'commune_fr', 'ville', 'الجماعة', 'المقاطعة', 'العمالة'];
            const extraData: Record<string, any> = {};
            const combinedData: Record<string, { N?: any, S?: any, H?: any, originalKey?: string }> = {};
            
            Object.keys(item).forEach(key => {
              const lowerKey = key.toLowerCase().trim();
              if (standardKeys.includes(lowerKey)) return;

              const val = item[key];
              if (val === null || val === undefined || val === '') return;
              const valStr = String(val).trim().toUpperCase();
              if (valStr === 'N' || valStr === 'لا') return;

              let isCombined = false;
              
              if (lowerKey.startsWith('nombre') || lowerKey.startsWith('عدد')) {
                const base = lowerKey.replace(/^nombre\s*/, '').replace(/^عدد\s*/, '').trim();
                if (base) {
                  if (!combinedData[base]) combinedData[base] = { originalKey: key.replace(/^nombre\s*/i, '').replace(/^عدد\s*/i, '').trim() };
                  combinedData[base].N = val;
                  isCombined = true;
                }
              } else if (lowerKey.startsWith('surface') || lowerKey.startsWith('مساحة')) {
                const base = lowerKey.replace(/^surface\s*/, '').replace(/^مساحة\s*/, '').trim();
                if (base) {
                  if (!combinedData[base]) combinedData[base] = { originalKey: key.replace(/^surface\s*/i, '').replace(/^مساحة\s*/i, '').trim() };
                  combinedData[base].S = val;
                  isCombined = true;
                }
              } else if (lowerKey.startsWith('hauteur') || lowerKey.startsWith('ارتفاع')) {
                const base = lowerKey.replace(/^hauteur\s*/, '').replace(/^ارتفاع\s*/, '').trim();
                if (base) {
                  if (!combinedData[base]) combinedData[base] = { originalKey: key.replace(/^hauteur\s*/i, '').replace(/^ارتفاع\s*/i, '').trim() };
                  combinedData[base].H = val;
                  isCombined = true;
                }
              }

              if (!isCombined) {
                extraData[key] = val;
              }
            });

            Object.keys(combinedData).forEach(base => {
              const { N, S, H, originalKey } = combinedData[base];
              const displayKey = originalKey || base;
              
              const parts = [];
              if (N !== undefined) parts.push(`${t('Count', language)}: ${N}`);
              if (S !== undefined) parts.push(`${t('Area', language)}: ${S}`);
              if (H !== undefined) parts.push(`${t('Height', language)}: ${H}`);
              
              if (parts.length > 1) {
                extraData[displayKey] = parts.join(', ');
              } else if (N !== undefined) {
                extraData[`${t('Count', language)} ${displayKey}`] = N;
              } else if (S !== undefined) {
                extraData[`${t('Area', language)} ${displayKey}`] = S;
              } else if (H !== undefined) {
                extraData[`${t('Height', language)} ${displayKey}`] = H;
              }
            });

            return {
              id,
              name,
              name_ar,
              name_fr,
              name_en,
              latitude,
              longitude,
              address,
              commune,
              type,
              services: parseArray(servicesRaw),
              items: parseArray(itemsRaw),
              image,
              extraData
            };
          });

          const isValid = formattedMosques.every(item => 
            item.name && !isNaN(item.latitude) && !isNaN(item.longitude)
          );
          
          if (isValid && formattedMosques.length > 0) {
            importMosques(formattedMosques);
            setStatus({ type: 'success', message: `${t('Successfully imported', language)} ${formattedMosques.length} ${t('mosques from Excel.', language)}` });
            setIsTranslating(false); 
            
            const termCounts: Record<string, number> = {};
            const addTerm = (term: any) => {
              if (typeof term === 'string' && term.trim().length >= 2 && isNaN(Number(term))) {
                termCounts[term] = (termCounts[term] || 0) + 1;
              }
            };

            formattedMosques.forEach(m => {
              addTerm(m.type);
              if (Array.isArray(m.services)) m.services.forEach(addTerm);
              if (Array.isArray(m.items)) m.items.forEach(addTerm);
              if (m.extraData) {
                Object.entries(m.extraData).forEach(([k, v]) => {
                  addTerm(k);
                  addTerm(v);
                });
              }
            });

            const existingDict = useAppStore.getState().dynamicTranslations || {};
            
            const filteredTerms = Object.keys(termCounts)
              .filter(term => !existingDict[term])
              .sort((a, b) => termCounts[b] - termCounts[a])
              .slice(0, 100);

            if (filteredTerms.length > 0) {
              translateTerms(filteredTerms).then(newTranslations => {
                if (Object.keys(newTranslations).length > 0) {
                  addDynamicTranslations(newTranslations);
                }
              }).catch(console.error);
            }
          } else {
            throw new Error(t("Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.", language));
          }
        } else {
          throw new Error(t("Invalid format: Expected rows of mosques in the Excel sheet.", language));
        }
        } catch (error: any) {
          setStatus({ type: 'error', message: error.message || t("Failed to parse Excel file.", language) });
        } finally {
          setIsTranslating(false);
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 50);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      setStatus({ type: 'error', message: t('Please upload a valid Excel or CSV file.', language) });
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <div className="z-20 px-4 pt-safe-4 pb-4 sticky top-0 border-b border-gray-200/50 bg-white/80 backdrop-blur-2xl">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('Settings', language)}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-6">
        
        {/* Language Selection */}
        <section className="bg-white rounded-[24px] shadow-card border border-gray-100/80 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center icon-badge-blue shrink-0 shadow-sm border border-white">
              <Globe size={18} className="text-blue-700" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('Language', language)}</h2>
              <p className="text-xs text-gray-500 font-medium">{t('Select your preferred app language', language)}</p>
            </div>
          </div>
          
          <div className="p-5 flex gap-3">
            {(['ar', 'fr'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "flex-1 py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all relative overflow-hidden active:scale-95",
                  language === lang 
                    ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                    : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className="text-2xl drop-shadow-sm">
                  {lang === 'fr' ? '🇫🇷' : '🇲🇦'}
                </div>
                <span className="text-xs font-bold whitespace-nowrap">
                  {lang === 'fr' ? 'Français' : 'العربية'}
                </span>
                {language === lang && (
                  <motion.div layoutId="lang-indicator" className="absolute inset-0 bg-blue-500/5" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Map & Route Settings */}
        <section className="bg-white rounded-[24px] shadow-card border border-gray-100/80 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center icon-badge-indigo shrink-0 shadow-sm border border-white">
              <MapPin size={18} className="text-indigo-700" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('Map & Routing', language)}</h2>
              <p className="text-xs text-gray-500 font-medium">{t('Customize your map experience', language)}</p>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700">
                  {t('Filter by Commune', language)}
                </label>
                {selectedCommune && (
                  <button 
                    onClick={() => setSelectedCommune(null)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded"
                  >
                    {t('Clear', language)}
                  </button>
                )}
              </div>
              
              <div className="relative">
                <select
                  value={selectedCommune || ''}
                  onChange={(e) => setSelectedCommune(e.target.value || null)}
                  className="w-full p-3.5 pr-10 bg-gray-50 border-2 border-gray-100 rounded-[16px] text-gray-700 text-sm font-semibold appearance-none focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all cursor-pointer"
                >
                  <option value="">{t('All Communes', language)}</option>
                  {communes.map(commune => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-1/2 -transparent-y-1/2 text-gray-400 pointer-events-none mt-[-9px]" />
              </div>
            </div>

            <div className="w-full h-[1px] bg-gray-100" />
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">
                {t('Default Route Profile', language)}
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRouteProfile('driving')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-[16px] transition-all border-2",
                    routeProfile === 'driving' 
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                      : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Car size={20} className={routeProfile === 'driving' ? "text-indigo-600" : ""} />
                  <span className="text-xs font-bold">{t('Driving', language)}</span>
                </button>
                <button
                  onClick={() => setRouteProfile('foot')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-[16px] transition-all border-2",
                    routeProfile === 'foot' 
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                      : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Footprints size={20} className={routeProfile === 'foot' ? "text-indigo-600" : ""} />
                  <span className="text-xs font-bold">{t('Walking', language)}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Map Appearance Settings */}
        <section className="bg-white rounded-[24px] shadow-card border border-gray-100/80 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center icon-badge-indigo shrink-0 shadow-sm border border-white">
              <Sun size={18} className="text-indigo-700" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('Map Appearance', language)}</h2>
              <p className="text-xs text-gray-500 font-medium">{t('Choose your preferred map theme', language)}</p>
            </div>
          </div>
          
          <div className="p-5 flex gap-3">
            <button
              onClick={() => setMapTheme('auto')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-[16px] transition-all border-2",
                mapTheme === 'auto' 
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                  : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
              )}
            >
              <Monitor size={20} className={mapTheme === 'auto' ? "text-indigo-600" : ""} />
              <span className="text-xs font-bold">{t('Auto', language)}</span>
            </button>
            <button
              onClick={() => setMapTheme('light')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-[16px] transition-all border-2",
                mapTheme === 'light' 
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                  : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
              )}
            >
              <Sun size={20} className={mapTheme === 'light' ? "text-indigo-600" : ""} />
              <span className="text-xs font-bold">{t('Light', language)}</span>
            </button>
            <button
              onClick={() => setMapTheme('dark')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-[16px] transition-all border-2",
                mapTheme === 'dark' 
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                  : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
              )}
            >
              <Moon size={20} className={mapTheme === 'dark' ? "text-indigo-600" : ""} />
              <span className="text-xs font-bold">{t('Dark', language)}</span>
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-[24px] shadow-card border border-gray-100/80 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center icon-badge-emerald shrink-0 shadow-sm border border-white">
              <Database size={18} className="text-emerald-700" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('Data Management', language)}</h2>
              <p className="text-xs text-gray-500 font-medium">{mosques.length} {t('mosques currently loaded', language)}</p>
            </div>
          </div>
          
          <div className="p-5">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={isTranslating}
              className={cn(
                "w-full flex flex-col items-center justify-center p-6 rounded-[20px] transition-all border-2 border-dashed group",
                isDragging ? "bg-emerald-50 border-emerald-400" : "bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-emerald-300",
                isTranslating && "bg-gray-50 opacity-70 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                isDragging ? "bg-emerald-100 text-emerald-600" : "bg-white text-emerald-500 shadow-sm group-hover:bg-emerald-50"
              )}>
                {isTranslating ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={24} />
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {isTranslating ? t('Translating...', language) : t('Import Excel File', language)}
              </h3>
              <p className="text-xs text-gray-500 font-medium text-center max-w-[200px]">
                {t('Upload an Excel file (.xlsx) to update the mosque database', language)}
              </p>
            </button>

            <AnimatePresence>
              {status && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "p-3 rounded-[16px] flex items-start text-sm border font-medium",
                    status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    status.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                    'bg-rose-50 text-rose-700 border-rose-100'
                  )}>
                    {status.type === 'success' 
                      ? <CheckCircle2 size={18} className={cn("mt-0.5 shrink-0", language === 'ar' ? 'ml-2' : 'mr-2')} /> 
                      : status.type === 'info'
                      ? <Loader2 size={18} className={cn("animate-spin mt-0.5 shrink-0", language === 'ar' ? 'ml-2' : 'mr-2')} />
                      : <AlertCircle size={18} className={cn("mt-0.5 shrink-0", language === 'ar' ? 'ml-2' : 'mr-2')} />
                    }
                    <span className="leading-snug">{status.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}
