import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mosque, TabType } from '../types';
import mosquesData from '../data/mosques.json';

export type Language = 'ar' | 'fr';
export type RouteProfile = 'foot' | 'driving';
export type MapStyle = 'street' | 'satellite';
export type MapTheme = 'light' | 'dark' | 'auto';

export interface RouteInfo {
  distance: number;
  duration: number;
}

interface AppState {
  mosques: Mosque[];
  favorites: number[];
  activeTab: TabType;
  selectedMosque: Mosque | null;
  routingToMosque: Mosque | null;
  routeInfo: RouteInfo | null;
  routeProfile: RouteProfile;
  userLocation: { latitude: number; longitude: number } | null;
  isNavigating: boolean;
  navSteps: any[];
  currentStepIndex: number;
  lastSpokenStepIndex: number;
  language: Language;
  dynamicTranslations: Record<string, Record<Language, string>>;
  selectedCommune: string | null;
  mapStyle: MapStyle;
  mapTheme: MapTheme;
  
  toggleFavorite: (id: number) => void;
  setActiveTab: (tab: TabType) => void;
  setSelectedMosque: (mosque: Mosque | null) => void;
  setRoutingToMosque: (mosque: Mosque | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setRouteProfile: (profile: RouteProfile) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  importMosques: (newMosques: Mosque[]) => void;
  setLanguage: (lang: Language) => void;
  addDynamicTranslations: (translations: Record<string, Record<Language, string>>) => void;
  setSelectedCommune: (commune: string | null) => void;
  setMapStyle: (style: MapStyle) => void;
  setMapTheme: (theme: MapTheme) => void;
  setIsNavigating: (val: boolean) => void;
  setNavSteps: (steps: any[]) => void;
  setCurrentStepIndex: (idx: number) => void;
  setLastSpokenStepIndex: (idx: number) => void;
  refreshLocation: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mosques: mosquesData as Mosque[],
      favorites: [],
      activeTab: 'map',
      selectedMosque: null,
      routingToMosque: null,
      routeInfo: null,
      routeProfile: 'foot',
      userLocation: null,
      isNavigating: false,
      navSteps: [],
      currentStepIndex: 0,
      lastSpokenStepIndex: -1,
      language: 'ar', // Default to Arabic
      dynamicTranslations: {},
      selectedCommune: null,
      mapStyle: 'street',
      mapTheme: 'dark', // Hard-coded default for Dark Mode

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMosque: (mosque) => set({ selectedMosque: mosque }),
      setRoutingToMosque: (mosque) => set({ routingToMosque: mosque }),
      setRouteInfo: (info) => set({ routeInfo: info }),
      setRouteProfile: (profile) => set({ routeProfile: profile }),
      setUserLocation: (location) => set({ userLocation: location }),
      importMosques: (newMosques) => set({ mosques: newMosques }),
      setLanguage: (lang) => set({ language: lang }),
      addDynamicTranslations: (translations) => set((state) => ({ 
        dynamicTranslations: { ...state.dynamicTranslations, ...translations } 
      })),
      setSelectedCommune: (commune) => set({ selectedCommune: commune }),
      setMapStyle: (style) => set({ mapStyle: style }),
      setMapTheme: (theme: MapTheme) => set({ mapTheme: theme }),
      setIsNavigating: (val) => set({ isNavigating: val, currentStepIndex: 0, lastSpokenStepIndex: -1 }),
      setNavSteps: (steps) => set({ navSteps: steps }),
      setCurrentStepIndex: (idx) => set({ currentStepIndex: idx }),
      setLastSpokenStepIndex: (idx) => set({ lastSpokenStepIndex: idx }),
      refreshLocation: () => new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              set({
                userLocation: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }
              });
              resolve();
            },
            (error) => {
              console.error("Error getting location:", error);
              resolve();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          resolve();
        }
      }),
    }),
    {
      name: 'mosque-finder-v9-absolute', // Changed key to force reset
      partialize: (state) => ({ 
        favorites: state.favorites, 
        mosques: state.mosques, 
        language: state.language,
        dynamicTranslations: state.dynamicTranslations,
        selectedCommune: state.selectedCommune,
        mapStyle: state.mapStyle,
        mapTheme: state.mapTheme
      }),
    }
  )
);
