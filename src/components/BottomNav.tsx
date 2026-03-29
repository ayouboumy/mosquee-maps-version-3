import { Map as MapIcon, Search, Heart, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';

export default function BottomNav() {
  const { activeTab, setActiveTab, language } = useAppStore();

  const tabs = [
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass pb-safe z-[1000] border-t border-gray-200/50">
      <div className="flex justify-around items-center h-[68px] max-w-md mx-auto relative px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-[1px] w-12 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-b-full shadow-emerald-glow"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <motion.div
                animate={{ 
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1.1 : 1
                }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isActive && "bg-emerald-50/80 shadow-sm"
                )}
              >
                <Icon size={22} className={cn(
                  "transition-all duration-300",
                  isActive ? "fill-emerald-100/50 drop-shadow-sm" : ""
                )} />
              </motion.div>
              <AnimatePresence>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.8 }}
                    className="text-[10px] font-bold tracking-wide"
                  >
                    {t(label, language)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
