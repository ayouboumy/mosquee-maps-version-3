import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'motion/react';

const KAABA = { lat: 21.4225, lng: 39.8262 };

export default function QiblaCompass() {
  const { userLocation, language } = useAppStore();
  const [qibla, setQibla] = useState<number | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    const lat1 = (userLocation.latitude * Math.PI) / 180;
    const lng1 = (userLocation.longitude * Math.PI) / 180;
    const lat2 = (KAABA.lat * Math.PI) / 180;
    const lng2 = (KAABA.lng * Math.PI) / 180;

    const y = Math.sin(lng2 - lng1);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lng2 - lng1);
    
    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = (qiblaRad * 180) / Math.PI;
    setQibla((qiblaDeg + 360) % 360);
  }, [userLocation]);

  if (!userLocation || qibla === null) return null;

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute top-28 right-4 z-[9999] flex flex-col items-center gap-2"
    >
      <div className="relative w-14 h-14 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white flex items-center justify-center overflow-hidden">
        {/* Compass Ring */}
        <div className="absolute inset-1 border-2 border-emerald-500/10 rounded-full" />
        
        {/* Kaaba Indicator */}
        <motion.div 
          animate={{ rotate: qibla }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-1 h-6 bg-emerald-600 rounded-full mb-6 relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45" />
          </div>
        </motion.div>

        <Compass size={20} className="text-gray-400 opacity-50" />
      </div>
      
      <div className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 shadow-lg">
        <span className="text-[10px] text-white font-black tracking-widest uppercase">Qibla</span>
      </div>
    </motion.div>
  );
}
