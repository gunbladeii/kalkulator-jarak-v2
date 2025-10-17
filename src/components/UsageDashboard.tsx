'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { exportUsageToJSON, exportUsageToCSV, logUsageStats } from '@/lib/usageAnalytics'

interface UsageStats {
  stats: {
    total_requests: number
    today_requests: number
    week_requests: number
    month_requests: number
    cache_hits: number
    cache_misses: number
    cache_hit_rate: string
    estimated_monthly_cost: string
    free_tier_remaining: number
  }
  recent_requests: Array<{
    timestamp: string
    route: string
    cached: boolean
    waypoints: number
  }>
}

export function UsageDashboard() {
  const [stats, setStats] = React.useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/usage-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch usage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (isVisible) {
      fetchStats()
      // Auto refresh every 30 seconds when visible
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white shadow-lg"
          size="sm"
        >
          📊 Statistik Penggunaan
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl border-2 border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📊 Statistik Penggunaan API</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <>
              {/* Enhanced Quota Status Alert */}
              <div className={`p-4 rounded-lg border ${
                stats.stats.free_tier_remaining <= 0 
                  ? 'bg-red-50 border-red-200' 
                  : stats.stats.free_tier_remaining <= 1000 
                    ? 'bg-red-50 border-red-200'
                    : stats.stats.free_tier_remaining <= 5000
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      stats.stats.free_tier_remaining <= 0 
                        ? 'bg-red-500' 
                        : stats.stats.free_tier_remaining <= 1000 
                          ? 'bg-red-500'
                          : stats.stats.free_tier_remaining <= 5000
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                    } ${stats.stats.free_tier_remaining <= 5000 ? 'animate-pulse' : ''}`}></div>
                    <div className={`font-semibold text-sm ${
                      stats.stats.free_tier_remaining <= 0 
                        ? 'text-red-800' 
                        : stats.stats.free_tier_remaining <= 1000 
                          ? 'text-red-800'
                          : stats.stats.free_tier_remaining <= 5000
                            ? 'text-amber-800'
                            : 'text-green-800'
                    }`}>
                      {stats.stats.free_tier_remaining <= 0 
                        ? '🚫 Kuota API Habis' 
                        : stats.stats.free_tier_remaining <= 1000 
                          ? '⚠️ Kuota Kritikal'
                          : stats.stats.free_tier_remaining <= 5000
                            ? '⚠️ Kuota Rendah'
                            : '✅ Status Kuota Baik'
                      }
                    </div>
                  </div>
                  <Button
                    onClick={fetchStats}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    title="Refresh quota status"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </div>
                <div className={`text-xs ${
                  stats.stats.free_tier_remaining <= 0 
                    ? 'text-red-700' 
                    : stats.stats.free_tier_remaining <= 1000 
                      ? 'text-red-700'
                      : stats.stats.free_tier_remaining <= 5000
                        ? 'text-amber-700'
                        : 'text-green-700'
                }`}>
                  {stats.stats.free_tier_remaining <= 0 
                    ? 'Google Distance Matrix API quota telah habis. Sistem pengiraan jarak tidak tersedia.'
                    : `Baki ${stats.stats.free_tier_remaining.toLocaleString()} daripada 40,000 permintaan bulanan.`
                  }
                </div>
                
                {/* Progress bar for quota usage */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs opacity-75">
                    <span>Penggunaan Bulan Ini</span>
                    <span>{stats.stats.month_requests.toLocaleString()} / 40,000</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        stats.stats.month_requests > 35000 ? 'bg-red-500' :
                        stats.stats.month_requests > 30000 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (stats.stats.month_requests / 40000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-600 text-xs font-medium">Hari ini</div>
                  <div className="text-blue-900 text-lg font-bold">{stats.stats.today_requests}</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-600 text-xs font-medium">Bulan ini</div>
                  <div className="text-green-900 text-lg font-bold">{stats.stats.month_requests}</div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-purple-600 text-xs font-medium">Cache Hit Rate</div>
                  <div className="text-purple-900 text-lg font-bold">{stats.stats.cache_hit_rate}</div>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-orange-600 text-xs font-medium">Est. Cost</div>
                  <div className="text-orange-900 text-lg font-bold">{stats.stats.estimated_monthly_cost}</div>
                </div>
              </div>

              {/* Progress Bar for Free Tier */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Free Tier Usage</span>
                  <span>{stats.stats.month_requests} / 40,000</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stats.stats.month_requests > 35000 ? 'bg-red-500' :
                      stats.stats.month_requests > 30000 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (stats.stats.month_requests / 40000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Recent Requests */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-700">Recent Requests</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stats.recent_requests.slice(0, 5).map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                      <div className={`w-2 h-2 rounded-full ${req.cached ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <div className="flex-1 truncate">{req.route}</div>
                      <div className="text-slate-500">
                        {req.waypoints > 0 && `+${req.waypoints}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={fetchStats} 
                  disabled={isLoading}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  🔄 Refresh Stats
                </Button>
                
                {/* Testing Controls */}
                <div className="grid grid-cols-1 gap-1">
                  <div className="text-xs font-medium text-slate-700 mb-1">🧪 Test Quota Scenarios:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/usage-stats', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'simulate-quota-exceeded' })
                          });
                          if (response.ok) fetchStats();
                        } catch (error) {
                          console.error('Test failed:', error);
                        }
                      }}
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-red-50 hover:bg-red-100 border-red-200"
                    >
                      🚫 Habis
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/usage-stats', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'simulate-quota-warning' })
                          });
                          if (response.ok) fetchStats();
                        } catch (error) {
                          console.error('Test failed:', error);
                        }
                      }}
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-amber-50 hover:bg-amber-100 border-amber-200"
                    >
                      ⚠️ Amaran
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/usage-stats', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'reset-quota' })
                          });
                          if (response.ok) fetchStats();
                        } catch (error) {
                          console.error('Test failed:', error);
                        }
                      }}
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      ✅ Reset
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={async () => {
                      try {
                        await exportUsageToJSON()
                      } catch (error) {
                        console.error('Export failed:', error)
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    📄 Export JSON
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        await exportUsageToCSV()
                      } catch (error) {
                        console.error('Export failed:', error)
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    📊 Export CSV
                  </Button>
                </div>
                
                <Button 
                  onClick={async () => {
                    try {
                      await logUsageStats()
                    } catch (error) {
                      console.error('Log failed:', error)
                    }
                  }}
                  variant="ghost" 
                  size="sm"
                  className="w-full text-xs text-slate-500"
                >
                  🔍 Log to Console
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-slate-500">
              Failed to load stats
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}