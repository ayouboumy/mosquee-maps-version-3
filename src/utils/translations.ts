import { Language, useAppStore } from '../store/useAppStore';

const dictionary: Record<string, Record<Language, string>> = {
  // UI Elements
  'Settings': { en: 'Settings', fr: 'Paramètres', ar: 'الإعدادات' },
  'Data Management': { en: 'Data Management', fr: 'Gestion des données', ar: 'إدارة البيانات' },
  'mosques currently loaded': { en: 'mosques currently loaded', fr: 'mosquées actuellement chargées', ar: 'مساجد محملة حالياً' },
  'Import an Excel file': { 
    en: 'Import an Excel file (.xlsx or .xls) to update the mosque database. The sheet should contain columns for name, latitude, longitude, address, type, services, and items.', 
    fr: 'Importez un fichier Excel (.xlsx ou .xls) pour mettre à jour la base de données. La feuille doit contenir les colonnes nom, latitude, longitude, adresse, type, services et items.', 
    ar: 'قم باستيراد ملف Excel (.xlsx أو .xls) لتحديث قاعدة بيانات المساجد. يجب أن تحتوي الورقة على أعمدة للاسم وخط العرض وخط الطول والعنوان والنوع والخدمات والعناصر.' 
  },
  'Import Excel File': { en: 'Import Excel File', fr: 'Importer un fichier Excel', ar: 'استيراد ملف إكسل' },
  'Parsing Excel file...': { en: 'Parsing Excel file...', fr: 'Analyse du fichier Excel...', ar: 'جاري تحليل ملف إكسل...' },
  'Translating new terms intelligently...': { en: 'Translating new terms intelligently...', fr: 'Traduction intelligente des nouveaux termes...', ar: 'جاري ترجمة المصطلحات الجديدة بذكاء...' },
  'Translating...': { en: 'Translating...', fr: 'Traduction...', ar: 'جاري الترجمة...' },
  'Language': { en: 'Language', fr: 'Langue', ar: 'اللغة' },
  'Select Language': { en: 'Select Language', fr: 'Choisir la langue', ar: 'اختر اللغة' },
  'Map': { en: 'Map', fr: 'Carte', ar: 'الخريطة' },
  'Search': { en: 'Search', fr: 'Recherche', ar: 'بحث' },
  'Favorites': { en: 'Favorites', fr: 'Favoris', ar: 'المفضلة' },
  'Search mosques...': { en: 'Search mosques...', fr: 'Rechercher des mosquées...', ar: 'ابحث عن المساجد...' },
  'No mosques found': { en: 'No mosques found', fr: 'Aucune mosquée trouvée', ar: 'لم يتم العثور على مساجد' },
  'No favorite mosques yet': { en: 'No favorite mosques yet', fr: 'Aucune mosquée favorite', ar: 'لا توجد مساجد مفضلة بعد' },
  'Tap the heart icon on a mosque to add it to your favorites.': { 
    en: 'Tap the heart icon on a mosque to add it to your favorites.', 
    fr: 'Appuyez sur l\'icône cœur d\'une mosquée pour l\'ajouter à vos favoris.', 
    ar: 'اضغط على أيقونة القلب على المسجد لإضافته إلى مفضلتك.' 
  },
  'Successfully imported': { en: 'Successfully imported', fr: 'Importation réussie de', ar: 'تم استيراد بنجاح' },
  'mosques from Excel.': { en: 'mosques from Excel.', fr: 'mosquées depuis Excel.', ar: 'مسجد من إكسل.' },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file. If your coordinates are in Lambert projection, please convert them to WGS84 (GPS) first.': { 
    en: 'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file. If your coordinates are in Lambert projection, please convert them to WGS84 (GPS) first.', 
    fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel. Si vos coordonnées sont en projection Lambert, veuillez d\'abord les convertir en WGS84 (GPS).', 
    ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل. إذا كانت إحداثياتك بنظام لامبرت، يرجى تحويلها إلى WGS84 (GPS) أولاً.' 
  },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.': { en: 'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.', fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel.', ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل.' },
  'Invalid format: Expected rows of mosques in the Excel sheet.': { en: 'Invalid format: Expected rows of mosques in the Excel sheet.', fr: 'Format invalide : Des lignes de mosquées étaient attendues dans la feuille Excel.', ar: 'تنسيق غير صالح: كان من المتوقع وجود صفوف من المساجد في ورقة إكسل.' },
  'Failed to parse Excel file.': { en: 'Failed to parse Excel file.', fr: 'Échec de l\'analyse du fichier Excel.', ar: 'فشل في تحليل ملف إكسل.' },
  'Navigate': { en: 'Navigate', fr: 'Naviguer', ar: 'توجيه' },
  'Save': { en: 'Save', fr: 'Enregistrer', ar: 'حفظ' },
  'Details': { en: 'Details', fr: 'Détails', ar: 'تفاصيل' },
  'My Location': { en: 'My Location', fr: 'Ma position', ar: 'موقعي' },
  'Location access denied or unavailable.': { en: 'Location access denied or unavailable.', fr: 'Accès à la position refusé ou indisponible.', ar: 'الوصول إلى الموقع مرفوض أو غير متاح.' },
  'Geolocation is not supported by your browser.': { en: 'Geolocation is not supported by your browser.', fr: 'La géolocalisation n\'est pas prise en charge par votre navigateur.', ar: 'تحديد الموقع الجغرافي غير مدعوم في متصفحك.' },
  'Search mosques, cities...': { en: 'Search mosques, cities...', fr: 'Rechercher des mosquées, des villes...', ar: 'ابحث عن المساجد، المدن...' },
  'Filters': { en: 'Filters', fr: 'Filtres', ar: 'تصفية' },
  'Type': { en: 'Type', fr: 'Type', ar: 'النوع' },
  'All': { en: 'All', fr: 'Tout', ar: 'الكل' },
  'Try adjusting your search or filters': { en: 'Try adjusting your search or filters', fr: 'Essayez d\'ajuster votre recherche ou vos filtres', ar: 'حاول تعديل بحثك أو عوامل التصفية' },
  'Saved Mosques': { en: 'Saved Mosques', fr: 'Mosquées enregistrées', ar: 'المساجد المحفوظة' },
  'places saved': { en: 'places saved', fr: 'lieux enregistrés', ar: 'أماكن محفوظة' },
  'No favorites yet': { en: 'No favorites yet', fr: 'Aucun favori pour le moment', ar: 'لا توجد مفضلة بعد' },
  'Save your favorite mosques to quickly access them later, even offline.': { en: 'Save your favorite mosques to quickly access them later, even offline.', fr: 'Enregistrez vos mosquées préférées pour y accéder rapidement plus tard, même hors ligne.', ar: 'احفظ مساجدك المفضلة للوصول إليها بسرعة لاحقًا، حتى بدون إنترنت.' },
  'Explore Mosques': { en: 'Explore Mosques', fr: 'Explorer les mosquées', ar: 'استكشف المساجد' },
  'Open in Maps': { en: 'Open in Maps', fr: 'Ouvrir dans Maps', ar: 'افتح في الخرائط' },
  'Services': { en: 'Services', fr: 'Services', ar: 'الخدمات' },
  'Facilities': { en: 'Facilities', fr: 'Équipements', ar: 'المرافق' },
  'No facilities listed': { en: 'No facilities listed', fr: 'Aucun équipement listé', ar: 'لا توجد مرافق مدرجة' },
  'Additional Information': { en: 'Additional Information', fr: 'Informations supplémentaires', ar: 'معلومات إضافية' },
  'Unknown Mosque': { en: 'Unknown Mosque', fr: 'Mosquée inconnue', ar: 'مسجد غير معروف' },
  'Unknown Address': { en: 'Unknown Address', fr: 'Adresse inconnue', ar: 'عنوان غير معروف' },
  'Mosque': { en: 'Mosque', fr: 'Mosquée', ar: 'مسجد' },
  'Grand Mosque': { en: 'Grand Mosque', fr: 'Grande Mosquée', ar: 'مسجد كبير' },
  'Historic Mosque': { en: 'Historic Mosque', fr: 'Mosquée Historique', ar: 'مسجد تاريخي' },
  'University Mosque': { en: 'University Mosque', fr: 'Mosquée Universitaire', ar: 'مسجد جامعي' },
  'Local Mosque': { en: 'Local Mosque', fr: 'Mosquée de Quartier', ar: 'مسجد محلي' },
  'Nearest Mosques': { en: 'Nearest Mosques', fr: 'Mosquées les plus proches', ar: 'أقرب المساجد' },
  'Location access is required to find nearest mosques.': { en: 'Location access is required to find nearest mosques.', fr: 'L\'accès à la position est requis pour trouver les mosquées les plus proches.', ar: 'الوصول إلى الموقع مطلوب للعثور على أقرب المساجد.' },
  'No mosques found.': { en: 'No mosques found.', fr: 'Aucune mosquée trouvée.', ar: 'لم يتم العثور على مساجد.' },
  'Directions': { en: 'Directions', fr: 'Itinéraire', ar: 'الاتجاهات' },
  'Clear Route': { en: 'Clear Route', fr: 'Effacer l\'itinéraire', ar: 'مسح المسار' },
  'Calculating...': { en: 'Calculating...', fr: 'Calcul en cours...', ar: 'جاري الحساب...' },
  'Start': { en: 'Start', fr: 'Démarrer', ar: 'ابدأ' },
  'Google Maps': { en: 'Google Maps', fr: 'Google Maps', ar: 'خرائط جوجل' },
  'Location': { en: 'Location', fr: 'Position', ar: 'الموقع' },
  'Position': { en: 'Position', fr: 'Position', ar: 'الموقع' },
  'Copied': { en: 'Copied', fr: 'Copié', ar: 'تم النسخ' },
  'Street Mode': { en: 'Street Mode', fr: 'Mode Rue', ar: 'وضع الشارع' },
  'Satellite Mode': { en: 'Satellite Mode', fr: 'Mode Satellite', ar: 'وضع القمر الصناعي' },
  'Road': { en: 'Road', fr: 'Route', ar: 'طريق' },
  'Walking': { en: 'Walking', fr: 'À pied', ar: 'مشي' },
  'Driving': { en: 'Driving', fr: 'En voiture', ar: 'قيادة' },
  'Your Location': { en: 'Your Location', fr: 'Votre position', ar: 'موقعك' },
  'Share': { en: 'Share', fr: 'Partager', ar: 'مشاركة' },
  'View Full Details': { en: 'View Full Details', fr: 'Voir les détails complets', ar: 'عرض التفاصيل الكاملة' },
  'Nearby Mosques': { en: 'Nearby Mosques', fr: 'Mosquées à proximité', ar: 'مساجد قريبة' },
  'Commune': { en: 'Commune', fr: 'Commune', ar: 'الجماعة' },
  'Location Details': { en: 'Location Details', fr: 'Détails de l\'emplacement', ar: 'تفاصيل الموقع' },
  'Address': { en: 'Address', fr: 'Adresse', ar: 'العنوان' },
  'Capacity & Space': { en: 'Capacity & Space', fr: 'Capacité et Espace', ar: 'السعة والمساحة' },
  'Prayer Areas': { en: 'Prayer Areas', fr: 'Espaces de Prière', ar: 'أماكن الصلاة' },
  'Sanitary Facilities': { en: 'Sanitary Facilities', fr: 'Installations Sanitaires', ar: 'المرافق الصحية' },
  'Staff & Housing': { en: 'Staff & Housing', fr: 'Personnel et Logement', ar: 'الموظفون والسكن' },
  'Status & Environment': { en: 'Status & Environment', fr: 'Statut et Environnement', ar: 'الحالة والبيئة' },
  'Other Details': { en: 'Other Details', fr: 'Autres Détails', ar: 'تفاصيل أخرى' },
  'Mosque Components': { en: 'Mosque Components', fr: 'Composants de la Mosquée', ar: 'مكونات المسجد' },
  'Count': { en: 'Count', fr: 'Nombre', ar: 'العدد' },
  'Area': { en: 'Area', fr: 'Surface', ar: 'المساحة' },
  'Height': { en: 'Height', fr: 'Hauteur', ar: 'الارتفاع' },
  'Key Highlights': { en: 'Key Highlights', fr: 'Points Forts', ar: 'أبرز النقاط' },
  'Capacity': { en: 'Capacity', fr: 'Capacité', ar: 'السعة' },
  'Surface': { en: 'Surface', fr: 'Surface', ar: 'المساحة' },
  'Condition': { en: 'Condition', fr: 'État', ar: 'الحالة' },
  'Built': { en: 'Built', fr: 'Construit en', ar: 'سنة البناء' },
  'Map Settings': { en: 'Map Settings', fr: 'Paramètres de la carte', ar: 'إعدادات الخريطة' },
  'Filter by Commune': { en: 'Filter by Commune', fr: 'Filtrer par commune', ar: 'تصفية حسب الجماعة' },
  'Select Commune': { en: 'Select Commune', fr: 'Sélectionner une commune', ar: 'اختر الجماعة' },
  'None': { en: 'None', fr: 'Aucun', ar: 'لا شيء' },
  'Only mosques in': { en: 'Only mosques in', fr: 'Seules les mosquées de', ar: 'فقط المساجد في' },
  'will be shown on the map.': { en: 'will be shown on the map.', fr: 'seront affichées sur la carte.', ar: 'ستظهر على الخريطة.' },

  // Common Data Keys & Values (from Excel)
  'salle de prière hommes': { en: 'Men\'s prayer room', fr: 'Salle de prière hommes', ar: 'قاعة صلاة الرجال' },
  'salle de prière femmes': { en: 'Women\'s prayer room', fr: 'Salle de prière femmes', ar: 'قاعة صلاة النساء' },
  'sanitaires': { en: 'Restrooms', fr: 'Sanitaires', ar: 'مرافق صحية' },
  'woudou': { en: 'Ablution area', fr: 'Lieu d\'ablution', ar: 'مكان الوضوء' },
  'logement imam': { en: 'Imam\'s housing', fr: 'Logement imam', ar: 'سكن الإمام' },
  'logement muezzin': { en: 'Muezzin\'s housing', fr: 'Logement muezzin', ar: 'سكن المؤذن' },
  'salle de prière': { en: 'Prayer room', fr: 'Salle de prière', ar: 'قاعة الصلاة' },
  'capacité': { en: 'Capacity', fr: 'Capacité', ar: 'السعة' },
  'surface': { en: 'Surface', fr: 'Surface', ar: 'المساحة' },
  'nombre': { en: 'Count', fr: 'Nombre', ar: 'العدد' },
  'mosquée': { en: 'Mosque', fr: 'Mosquée', ar: 'مسجد' },
  'zaouia': { en: 'Zaouia', fr: 'Zaouia', ar: 'زاوية' },
  'lieu de prière': { en: 'Prayer place', fr: 'Lieu de prière', ar: 'مصلى' },
  'urbain': { en: 'Urban', fr: 'Urbain', ar: 'حضري' },
  'rural': { en: 'Rural', fr: 'Rural', ar: 'قروي' },
  'oui': { en: 'Yes', fr: 'Oui', ar: 'نعم' },
  'non': { en: 'No', fr: 'Non', ar: 'لا' },
  'etat': { en: 'Condition', fr: 'Etat', ar: 'الحالة' },
  'bon': { en: 'Good', fr: 'Bon', ar: 'جيد' },
  'moyen': { en: 'Average', fr: 'Moyen', ar: 'متوسط' },
  'mauvais': { en: 'Bad', fr: 'Mauvais', ar: 'سيء' },
  'en construction': { en: 'Under construction', fr: 'En construction', ar: 'قيد الإنشاء' },
  'fermé': { en: 'Closed', fr: 'Fermé', ar: 'مغلق' },
  'ouvert': { en: 'Open', fr: 'Ouvert', ar: 'مفتوح' },
};

export function t(key: string, lang: Language): string {
  if (!key) return '';
  
  const cleanKey = key.trim();
  const lowerKey = cleanKey.toLowerCase();
  
  // Check dynamic translations first
  const dynamicTranslations = useAppStore.getState().dynamicTranslations;
  if (dynamicTranslations) {
    if (dynamicTranslations[cleanKey] && dynamicTranslations[cleanKey][lang]) {
      return dynamicTranslations[cleanKey][lang];
    }
    for (const dictKey in dynamicTranslations) {
      if (dictKey.toLowerCase() === lowerKey && dynamicTranslations[dictKey][lang]) {
        return dynamicTranslations[dictKey][lang];
      }
    }
  }

  // Direct match
  if (dictionary[cleanKey] && dictionary[cleanKey][lang]) {
    return dictionary[cleanKey][lang];
  }
  
  // Case-insensitive match for data keys
  for (const dictKey in dictionary) {
    if (dictKey.toLowerCase() === lowerKey) {
      return dictionary[dictKey][lang];
    }
  }

  // Handle combined keys like "Nombre salle de prière hommes" or "salle de prière hommes N=..., S=..."
  if (lang === 'ar') {
    let translated = cleanKey;
    
    // Replace known parts
    translated = translated.replace(/Nombre/gi, 'عدد');
    translated = translated.replace(/Surface/gi, 'مساحة');
    translated = translated.replace(/salle de prière hommes/gi, 'قاعة صلاة الرجال');
    translated = translated.replace(/salle de prière femmes/gi, 'قاعة صلاة النساء');
    translated = translated.replace(/salle de prière/gi, 'قاعة الصلاة');
    translated = translated.replace(/sanitaires/gi, 'مرافق صحية');
    translated = translated.replace(/logement imam/gi, 'سكن الإمام');
    translated = translated.replace(/logement muezzin/gi, 'سكن المؤذن');
    translated = translated.replace(/woudou/gi, 'مكان الوضوء');
    translated = translated.replace(/N=/g, 'العدد=');
    translated = translated.replace(/S=/g, 'المساحة=');
    
    return translated;
  }

  if (lang === 'en') {
    let translated = cleanKey;
    
    // Replace known parts
    translated = translated.replace(/Nombre/gi, 'Count');
    translated = translated.replace(/Surface/gi, 'Surface');
    translated = translated.replace(/salle de prière hommes/gi, 'Men\'s prayer room');
    translated = translated.replace(/salle de prière femmes/gi, 'Women\'s prayer room');
    translated = translated.replace(/salle de prière/gi, 'Prayer room');
    translated = translated.replace(/sanitaires/gi, 'Restrooms');
    translated = translated.replace(/logement imam/gi, 'Imam\'s housing');
    translated = translated.replace(/logement muezzin/gi, 'Muezzin\'s housing');
    translated = translated.replace(/woudou/gi, 'Ablution area');
    translated = translated.replace(/N=/g, 'Count=');
    translated = translated.replace(/S=/g, 'Surface=');
    
    return translated;
  }

  return cleanKey;
}

export function getLocalizedName(mosque: any, lang: Language): string {
  if (lang === 'ar' && mosque.name_ar) return mosque.name_ar;
  if (lang === 'fr' && mosque.name_fr) return mosque.name_fr;
  if (lang === 'en' && mosque.name_en) return mosque.name_en;
  return mosque.name;
}
