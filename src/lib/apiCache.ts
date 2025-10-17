// Simple in-memory cache for API responses
// In production, you'd want to use Redis or database

interface RouteResult {
  distance: number;
  legs: RouteLeg[];
  total_legs: number;
  waypoints_used: number;
  schools: string[];
  provider: string;
  fallback_used: boolean;
  cached_at: string;
  optimization?: OptimizationResult;
}

interface RouteLeg {
  from: string;
  to: string;
  distance_km: number;
  duration: string;
  distance_text: string;
}

interface OptimizationResult {
  enabled: boolean;
  applied?: boolean;
  reason?: string;
  original_order?: string[];
  optimized_order?: string[];
  distance_saved?: number;
  percentage_saved?: number;
  original_total_distance?: number;
  optimized_total_distance?: number;
}

interface CacheEntry {
  data: RouteResult;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  // Generate cache key from route parameters
  generateKey(origin: string, destination: string, waypoints: string[] = [], optimization?: string): string {
    const sorted = [origin, ...waypoints.sort(), destination];
    const baseKey = `route:${sorted.join('|')}`;
    return optimization ? `${baseKey}:${optimization}` : baseKey;
  }

  // Set cache entry
  set(key: string, data: RouteResult, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });

    console.log(`💾 Cached route: ${key}`);
  }

  // Get cache entry
  get(key: string): RouteResult | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`🗑️ Expired cache removed: ${key}`);
      return null;
    }

    console.log(`🎯 Cache hit: ${key}`);
    return entry.data;
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    let cleared = 0;

    // Convert to array to avoid iterator issues
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleanup: ${cleared} expired cache entries removed`);
    }
  }

  // Get cache stats
  getStats(): { total: number; size: string } {
    const values = Array.from(this.cache.values());
    return {
      total: this.cache.size,
      size: `${Math.round(JSON.stringify(values).length / 1024)}KB`
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Auto cleanup every hour
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    apiCache.cleanup();
  }, 60 * 60 * 1000);
}