export interface Mosque {
  id: number;
  name: string;
  name_ar?: string;
  name_fr?: string;
  name_en?: string;
  latitude: number;
  longitude: number;
  address: string;
  type: string;
  services: string[];
  items: string[];
  image: string;
  commune: string;
  extraData?: Record<string, any>;
}

export type TabType = 'map' | 'search' | 'favorites' | 'settings';
