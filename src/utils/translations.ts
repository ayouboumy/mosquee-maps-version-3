import { Language, useAppStore } from '../store/useAppStore';

const dictionary: Record<string, Record<Language, string>> = {
  // UI Elements
  'Settings': { fr: 'Paramètres', ar: 'الإعدادات' },
  'Data Management': { fr: 'Gestion des données', ar: 'إدارة البيانات' },
  'mosques currently loaded': { fr: 'mosquées actuellement chargées', ar: 'مساجد محملة حالياً' },
  'Import an Excel file': { 
    fr: 'Importez un fichier Excel (.xlsx ou .xls) to update the mosque database. The sheet should contain columns for name, latitude, longitude, address, type, services and items.', 
    ar: 'قم باستيراد ملف Excel (.xlsx أو .xls) لتحديث قاعدة بيانات المساجد. يجب أن تحتوي الورقة على أعمدة للاسم وخط العرض وخط الطول والعنوان والنوع والخدمات والعناصر.' 
  },
  'Import Excel File': { fr: 'Importer un fichier Excel', ar: 'استيراد ملف إكسل' },
  'Parsing Excel file...': { fr: 'Analyse du fichier Excel...', ar: 'جاري تحليل ملف إكسل...' },
  'Translating new terms intelligently...': { fr: 'Traduction intelligente des nouveaux termes...', ar: 'جاري ترجمة المصطلحات الجديدة بذكاء...' },
  'Translating...': { fr: 'Traduction...', ar: 'جاري الترجمة...' },
  'Language': { fr: 'Langue', ar: 'اللغة' },
  'Select Language': { fr: 'Choisir la langue', ar: 'اختر اللغة' },
  'Map': { fr: 'Carte', ar: 'الخريطة' },
  'Search': { fr: 'Recherche', ar: 'بحث' },
  'Favorites': { fr: 'Favoris', ar: 'المفضلة' },
  'Search mosques...': { fr: 'Rechercher des mosquées...', ar: 'ابحث عن المساجد...' },
  'No mosques found': { fr: 'Aucune mosquée trouvée', ar: 'لم يتم العثور على مساجد' },
  'No favorite mosques yet': { fr: 'Aucune mosquée favorite', ar: 'لا توجد مساجد مفضلة بعد' },
  'Tap the heart icon on a mosque to add it to your favorites.': { 
    fr: 'Appuyez sur l\'icône cœur d\'une mosquée pour l\'ajouter à vos favoris.', 
    ar: 'اضغط على أيقونة القلب على المسجد لإضافته إلى مفضلتك.' 
  },
  'Successfully imported': { fr: 'Importation réussie de', ar: 'تم استيراد بنجاح' },
  'mosques from Excel.': { fr: 'mosquées depuis Excel.', ar: 'مسجد من إكسل.' },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file. If your coordinates are in Lambert projection, please convert them to WGS84 (GPS) first.': { 
    fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel. Si vos coordonnées sont en projection Lambert, veuillez d\'abord les convertir en WGS84 (GPS).', 
    ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل. إذا كانت إحداثياتك بنظام لامبرت، يرجى تحويلها إلى WGS84 (GPS) أولاً.' 
  },
  'Invalid format: Could not extract valid mosque data (name, latitude, longitude) from the Excel file.': { fr: 'Format invalide : Impossible d\'extraire des données valides (nom, latitude, longitude) du fichier Excel.', ar: 'تنسيق غير صالح: تعذر استخراج بيانات مسجد صالحة (الاسم، خط العرض، خط الطول) من ملف إكسل.' },
  'Invalid format: Expected rows of mosques in the Excel sheet.': { fr: 'Format invalide : Des lignes de mosquées étaient attendues dans la feuille Excel.', ar: 'تنسيق غير صالح: كان من المتوقع وجود صفوف من المساجد في ورقة إكسل.' },
  'Failed to parse Excel file.': { fr: 'Échec de l\'analyse du fichier Excel.', ar: 'فشل في تحليل ملف إكسل.' },
  'Navigate': { fr: 'Naviguer', ar: 'توجيه' },
  'Save': { fr: 'Enregistrer', ar: 'حفظ' },
  'Details': { fr: 'Détails', ar: 'تفاصيل' },
  'My Location': { fr: 'Ma position', ar: 'موقعي' },
  'Location access denied or unavailable.': { fr: 'Accès à la position refusé ou indisponible.', ar: 'الوصول إلى الموقع مرفوض أو غير متاح.' },
  'Geolocation is not supported by your browser.': { fr: 'La géolocalisation n\'est pas prise en charge par votre navigateur.', ar: 'تحديد الموقع الجغرافي غير مدعوم في متصفحك.' },
  'Search mosques, cities...': { fr: 'Rechercher des mosquées, des villes...', ar: 'ابحث عن المساجد، المدن...' },
  'Filters': { fr: 'Filtres', ar: 'تصفية' },
  'Type': { fr: 'Type', ar: 'النوع' },
  'All': { fr: 'Tout', ar: 'الكل' },
  'Try adjusting your search or filters': { fr: 'Essayez d\'ajuster votre recherche ou vos filtres', ar: 'حاول تعديل بحثك أو عوامل التصفية' },
  'Saved Mosques': { fr: 'Mosquées enregistrées', ar: 'المساجد المحفوظة' },
  'places saved': { fr: 'lieux enregistrés', ar: 'أماكن محفوظة' },
  'No favorites yet': { fr: 'Aucun favori pour le moment', ar: 'لا توجد مفضلة بعد' },
  'Save your favorite mosques to quickly access them later, even offline.': { fr: 'Enregistrez vos mosquées préférées pour y accéder rapidement plus tard, même hors ligne.', ar: 'احفظ مساجدك المفضلة للوصول إليها بسرعة لاحقًا، حتى بدون إنترنت.' },
  'Explore Mosques': { fr: 'Explorer les mosquées', ar: 'استكشف المساجد' },
  'Open in Maps': { fr: 'Ouvrir dans Maps', ar: 'افتح في الخرائط' },
  'Services': { fr: 'Services', ar: 'الخدمات' },
  'Facilities': { fr: 'Équipements', ar: 'المرافق' },
  'No facilities listed': { fr: 'Aucun équipement listé', ar: 'لا توجد مرافق مدرجة' },
  'Additional Information': { fr: 'Informations supplémentaires', ar: 'معلومات إضافية' },
  'Unknown Mosque': { fr: 'Mosquée inconnue', ar: 'مسجد غير معروف' },
  'Unknown Address': { fr: 'Adresse inconnue', ar: 'عنوان غير معروف' },
  'Mosque': { fr: 'Mosquée', ar: 'مسجد' },
  'Grand Mosque': { fr: 'Grande Mosquée', ar: 'مسجد كبير' },
  'Historic Mosque': { fr: 'Mosquée Historique', ar: 'مسجد تاريخي' },
  'University Mosque': { fr: 'Mosquée Universitaire', ar: 'مسجد جامعي' },
  'Local Mosque': { fr: 'Mosquée de Quartier', ar: 'مسجد محلي' },
  'Nearest Mosques': { fr: 'Mosquées les plus proches', ar: 'أقرب المساجد' },
  'Location access is required to find nearest mosques.': { fr: 'L\'accès à la position est requis pour trouver les mosquées les plus proches.', ar: 'الوصول إلى الموقع مطلوب للعثور على أقرب المساجد.' },
  'No mosques found.': { fr: 'Aucune mosquée trouvée.', ar: 'لم يتم العثور على مساجد.' },
  'Directions': { fr: 'Itinéraire', ar: 'الاتجاهات' },
  'Clear Route': { fr: 'Effacer l\'itinéraire', ar: 'مسح المسار' },
  'Calculating...': { fr: 'Calcul en cours...', ar: 'جاري الحساب...' },
  'Start': { fr: 'Démarrer', ar: 'ابدأ' },
  'Google Maps': { fr: 'Google Maps', ar: 'خرائط جوجل' },
  'Location': { fr: 'Position', ar: 'الموقع' },
  'Position': { fr: 'Position', ar: 'الموقع' },
  'Copied': { fr: 'Copié', ar: 'تم النسخ' },
  'Street Mode': { fr: 'Mode Rue', ar: 'وضع الشارع' },
  'Satellite Mode': { fr: 'Mode Satellite', ar: 'وضع القمر الصناعي' },
  'Road': { fr: 'Route', ar: 'طريق' },
  'Walking': { fr: 'À pied', ar: 'مشي' },
  'Driving': { fr: 'En voiture', ar: 'قيادة' },
  'Your Location': { fr: 'Votre position', ar: 'موقعك' },
  'Share': { fr: 'Partager', ar: 'مشاركة' },
  'View Full Details': { fr: 'Voir les détails complets', ar: 'عرض التفاصيل الكاملة' },
  'Nearby Mosques': { fr: 'Mosquées à proximité', ar: 'مساجد قريبة' },
  'Commune': { fr: 'Commune', ar: 'الجماعة' },
  'Location Details': { fr: 'Détails de l\'emplacement', ar: 'تفاصيل الموقع' },
  'Address': { fr: 'Adresse', ar: 'العنوان' },
  'Capacity & Space': { fr: 'Capacité et Espace', ar: 'السعة والمساحة' },
  'Prayer Areas': { fr: 'Espaces de Prière', ar: 'أماكن الصلاة' },
  'Sanitary Facilities': { fr: 'Installations Sanitaires', ar: 'المرافق الصحية' },
  'Staff & Housing': { fr: 'Personnel et Logement', ar: 'الموظفون والسكن' },
  'Status & Environment': { fr: 'Statut et Environnement', ar: 'الحالة والبيئة' },
  'Other Details': { fr: 'Autres Détails', ar: 'تفاصيل أخرى' },
  'Mosque Components': { fr: 'Composants de la Mosquée', ar: 'مكونات المسجد' },
  'Count': { fr: 'Nombre', ar: 'العدد' },
  'Area': { fr: 'Surface', ar: 'المساحة' },
  'Height': { fr: 'Hauteur', ar: 'الارتفاع' },
  'Key Highlights': { fr: 'Points Forts', ar: 'أبرز النقاط' },
  'Capacity': { fr: 'Capacité', ar: 'السعة' },
  'Surface': { fr: 'Surface', ar: 'المساحة' },
  'Condition': { fr: 'État', ar: 'الحالة' },
  'Built': { fr: 'Construit en', ar: 'سنة البناء' },
  'Map Settings': { fr: 'Paramètres de la carte', ar: 'إعدادات الخريطة' },
  'Filter by Commune': { fr: 'Filtrer par commune', ar: 'تصفية حسب الجماعة' },
  'Select Commune': { fr: 'Sélectionner une commune', ar: 'اختر الجماعة' },
  'None': { fr: 'Aucun', ar: 'لا شيء' },
  'Only mosques in': { fr: 'Seules les mosquées de', ar: 'فقط المساجد في' },
  'will be shown on the map.': { fr: 'seront affichées sur la carte.', ar: 'ستظهر على الخريطة.' },
  'Map Appearance': { ar: 'مظهر الخريطة', fr: 'Apparence de la carte' },
  'Map Theme': { ar: 'سمة الخريطة', fr: 'Thème de la carte' },
  'Light Mode': { ar: 'الوضع الفاتح', fr: 'Mode Clair' },
  'Dark Mode': { ar: 'الوضع الداكن', fr: 'Mode Sombre' },
  'Dynamic Mode': { ar: 'الوضع التلقائي', fr: 'الوضع التلقائي' },
  'Auto': { ar: 'تلقائي', fr: 'Auto' },
  'Light': { ar: 'فاتح', fr: 'Clair' },
  'Dark': { ar: 'داكن', fr: 'داكن' },
  'Dynamic': { ar: 'تلقائي', fr: 'تلقائي' },

  // Common Data Keys & Values (from Excel)
  'salle de prière hommes': { fr: 'Salle de prière hommes', ar: 'قاعة صلاة الرجال' },
  'salle de prière femmes': { fr: 'Salle de prière femmes', ar: 'قاعة صلاة النساء' },
  'sanitaires': { fr: 'Sanitaires', ar: 'مرافق صحية' },
  'woudou': { fr: 'Lieu d\'ablution', ar: 'مكان الوضوء' },
  'logement imam': { fr: 'Logement imam', ar: 'سكن الإمام' },
  'logement muezzin': { fr: 'Logement muezzin', ar: 'سكن المؤذن' },
  'salle de prière': { fr: 'Salle de prière', ar: 'قاعة الصلاة' },
  'capacité': { fr: 'Capacité', ar: 'السعة' },
  'surface': { fr: 'Surface', ar: 'المساحة' },
  'nombre': { fr: 'Nombre', ar: 'العدد' },
  'mosquée': { fr: 'Mosquée', ar: 'مسجد' },
  'zaouia': { fr: 'Zaouia', ar: 'زاوية' },
  'lieu de prière': { fr: 'Lieu de prière', ar: 'مصلى' },
  'urbain': { fr: 'Urbain', ar: 'حضري' },
  'rural': { fr: 'Rural', ar: 'قروي' },
  'oui': { fr: 'Oui', ar: 'نعم' },
  'non': { fr: 'Non', ar: 'لا' },
  'etat': { fr: 'Etat', ar: 'الحالة' },
  'bon': { fr: 'Bon', ar: 'جيد' },
  'moyen': { fr: 'Moyen', ar: 'متوسط' },
  'mauvais': { fr: 'Mauvais', ar: 'سيء' },
  'en construction': { fr: 'En construction', ar: 'قيد الإنشاء' },
  'fermé': { fr: 'Fermé', ar: 'مغلق' },
  'ouvert': { fr: 'Ouvert', ar: 'مفتوح' },
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

  return cleanKey;
}

export function getLocalizedName(mosque: any, lang: Language): string {
  if (lang === 'ar' && mosque.name_ar) return mosque.name_ar;
  if (lang === 'fr' && mosque.name_fr) return mosque.name_fr;
  return mosque.name;
}
