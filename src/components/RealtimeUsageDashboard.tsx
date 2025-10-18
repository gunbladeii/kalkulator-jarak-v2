// Example: Real-time Usage Dashboard dengan Supabase
// Konsep sama macam Firebase onSnapshot!

import { useEffect, useState } from 'react';
import { realtimeHelper, UsageStats } from '@/lib/realtimeSupabase';

export function RealtimeUsageDashboard() {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Setting up real-time connection...');

    // Macam onSnapshot Firebase - auto update bila data berubah!
    const channel = realtimeHelper.onUsageStatsChange((newData) => {
      console.log('📊 Usage stats updated in real-time:', newData);
      setUsageStats(newData);
      setIsConnected(true);
    });

    // Cleanup bila component unmount (penting!)
    return () => {
      console.log('Cleaning up real-time connection...');
      realtimeHelper.unsubscribe();
      setIsConnected(false);
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <h3 className="font-medium">
          Real-time Usage Stats {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </h3>
      </div>

      <div className="space-y-2">
        {usageStats.map((stat) => (
          <div key={stat.id} className="flex justify-between p-2 bg-gray-50 rounded">
            <span>{stat.date}</span>
            <span className="font-medium">{stat.count} requests</span>
          </div>
        ))}
      </div>

      {usageStats.length === 0 && (
        <p className="text-gray-500 text-sm">Waiting for real-time data...</p>
      )}
    </div>
  );
}

// Bonus: Real-time notification system
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const channel = realtimeHelper.onUsageStatsChange((newData) => {
      // Auto create notification bila quota hampir habis
      const totalToday = newData
        .filter(stat => stat.date === new Date().toISOString().split('T')[0])
        .reduce((sum, stat) => sum + stat.count, 0);

      if (totalToday > 2400) { // 80% dari 3000 quota
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'warning',
          message: `⚠️ Quota hampir habis: ${totalToday}/3000 requests`,
          timestamp: new Date()
        }]);
      }
    });

    return () => realtimeHelper.unsubscribe();
  }, []);

  return notifications;
}