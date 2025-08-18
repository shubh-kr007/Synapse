// components/NetworkIndicator.tsx
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function NetworkIndicator() {
  const [quality, setQuality] = useState<'good' | 'fair' | 'poor'>('good');

  useEffect(() => {
    const checkNetworkQuality = async () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const downlink = connection?.downlink || 10;
        
        if (downlink > 2) setQuality('good');
        else if (downlink > 0.5) setQuality('fair');
        else setQuality('poor');
      }
    };

    checkNetworkQuality();
    const interval = setInterval(checkNetworkQuality, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-1 h-3 rounded-full transition-all",
              quality === 'good' && "bg-green-500",
              quality === 'fair' && bar <= 2 && "bg-yellow-500",
              quality === 'fair' && bar > 2 && "bg-gray-400",
              quality === 'poor' && bar === 1 && "bg-red-500",
              quality === 'poor' && bar > 1 && "bg-gray-400"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-light-100">
        {quality === 'good' && "Good connection"}
        {quality === 'fair' && "Fair connection"}
        {quality === 'poor' && "Poor connection"}
      </span>
    </div>
  );
}