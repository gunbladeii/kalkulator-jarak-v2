// Real-time Supabase helper - macam onSnapshot Firebase!

import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UsageStats {
  id: string;
  date: string;
  count: number;
  created_at: string;
}

export class SupabaseRealtime {
  private channel: RealtimeChannel | null = null;

  // Macam onSnapshot Firebase, tapi untuk Supabase
  onUsageStatsChange(callback: (data: UsageStats[]) => void) {
    // Setup real-time subscription
    this.channel = supabase
      .channel('usage-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen semua changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'usage_stats'
        },
        async (payload) => {
          console.log('Real-time change detected:', payload);
          
          // Fetch latest data bila ada perubahan
          const { data, error } = await supabase
            .from('usage_stats')
            .select('*')
            .order('created_at', { ascending: false });

          if (data && !error) {
            callback(data);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return this.channel;
  }

  // Clean up subscription - penting untuk avoid memory leaks!
  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // Real-time untuk specific user activity
  onUserActivityChange(userId: string, callback: (activity: any) => void) {
    const channel = supabase
      .channel(`user-activity-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${userId}` // Filter untuk specific user je
        },
        (payload) => {
          callback(payload.new || payload.old);
        }
      )
      .subscribe();

    return channel;
  }

  // Presence feature - tahu siapa online (bonus feature!)
  trackUserPresence(userId: string, userInfo: any) {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        console.log('Online users:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userInfo);
        }
      });

    return channel;
  }
}

export const realtimeHelper = new SupabaseRealtime();