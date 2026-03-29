import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, useAnimation } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 0) {
        const isScrollable = container.scrollHeight > container.clientHeight + 1;
        // If not scrollable (like a map), only allow pull from the top edge (e.g., top 60px)
        if (!isScrollable && e.touches[0].clientY > 60) {
          return;
        }
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0 && container.scrollTop <= 0) {
        // Prevent default scrolling when pulling down
        if (e.cancelable) {
          e.preventDefault();
        }
        const progress = Math.min(diff / PULL_THRESHOLD, 1);
        setPullProgress(progress);
        controls.set({ y: Math.min(diff * 0.5, PULL_THRESHOLD) });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      const diff = currentY.current - startY.current;

      if (diff > PULL_THRESHOLD && !isRefreshing && container.scrollTop <= 0) {
        setIsRefreshing(true);
        controls.start({ y: 70 });
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullProgress(0);
          controls.start({ y: 0 });
        }
      } else {
        controls.start({ y: 0 });
        setPullProgress(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [isRefreshing, onRefresh, controls]);

  return (
    <div 
      className="h-full overflow-y-auto relative scrollbar-hide"
      ref={containerRef}
    >
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 -mt-16 z-50 pointer-events-none"
        animate={controls}
      >
        <div 
          className="bg-white rounded-full p-2 shadow-md flex items-center justify-center transition-opacity"
          style={{ 
            opacity: pullProgress > 0 ? pullProgress : isRefreshing ? 1 : 0,
            transform: `scale(${pullProgress > 0 ? 0.5 + pullProgress * 0.5 : isRefreshing ? 1 : 0.5})`
          }}
        >
          <RefreshCw 
            size={20} 
            className={`text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullProgress * 180}deg)` }}
          />
        </div>
      </motion.div>
      <motion.div animate={controls} className="h-full min-h-full">
        {children}
      </motion.div>
    </div>
  );
}
