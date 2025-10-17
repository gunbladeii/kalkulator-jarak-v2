import { NextResponse } from 'next/server';

// Simple in-memory usage tracking
// In production, this should be stored in database
let usageStats = {
  totalRequests: 0,
  todayRequests: 0,
  weekRequests: 0,
  monthRequests: 0,
  lastReset: new Date().toDateString(),
  cacheHits: 0,
  cacheMisses: 0,
  apiCost: 0, // Estimated cost in USD
  requestHistory: [] as Array<{
    timestamp: string;
    route: string;
    cached: boolean;
    waypoints: number;
  }>
};

// Reset daily counters if needed
function checkAndResetCounters() {
  const today = new Date().toDateString();
  if (usageStats.lastReset !== today) {
    usageStats.todayRequests = 0;
    usageStats.lastReset = today;
  }
}

export async function GET() {
  checkAndResetCounters();
  
  const cacheHitRate = usageStats.totalRequests > 0 
    ? ((usageStats.cacheHits / usageStats.totalRequests) * 100).toFixed(1)
    : 0;

  const estimatedMonthlyCost = usageStats.monthRequests > 40000 
    ? ((usageStats.monthRequests - 40000) / 1000) * 5 
    : 0;

  return NextResponse.json({
    stats: {
      total_requests: usageStats.totalRequests,
      today_requests: usageStats.todayRequests,
      week_requests: usageStats.weekRequests,
      month_requests: usageStats.monthRequests,
      cache_hits: usageStats.cacheHits,
      cache_misses: usageStats.cacheMisses,
      cache_hit_rate: `${cacheHitRate}%`,
      estimated_monthly_cost: `$${estimatedMonthlyCost.toFixed(2)}`,
      last_reset: usageStats.lastReset,
      free_tier_remaining: Math.max(0, 40000 - usageStats.monthRequests)
    },
    recent_requests: usageStats.requestHistory.slice(-10).reverse()
  });
}

export async function POST(request: Request) {
  try {
    const { route, cached, waypoints = 0 } = await request.json();
    
    checkAndResetCounters();
    
    // Update counters
    usageStats.totalRequests++;
    usageStats.todayRequests++;
    usageStats.weekRequests++;
    usageStats.monthRequests++;
    
    if (cached) {
      usageStats.cacheHits++;
    } else {
      usageStats.cacheMisses++;
    }
    
    // Add to history
    usageStats.requestHistory.push({
      timestamp: new Date().toISOString(),
      route,
      cached,
      waypoints
    });
    
    // Keep only last 100 requests in memory
    if (usageStats.requestHistory.length > 100) {
      usageStats.requestHistory = usageStats.requestHistory.slice(-100);
    }
    
    console.log(`📊 Usage tracked: ${route} (cached: ${cached}, waypoints: ${waypoints})`);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
  }
}

// PUT method for testing - simulate quota scenarios
export async function PUT(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'simulate-quota-exceeded') {
      // Simulate quota exceeded
      usageStats.monthRequests = 40000;
      console.log('🧪 Test: Simulated quota exceeded (40,000 requests)');
      return NextResponse.json({ 
        success: true, 
        message: 'Quota exceeded simulation activated',
        monthRequests: usageStats.monthRequests 
      });
    } else if (action === 'simulate-quota-warning') {
      // Simulate quota warning (38,000 requests)
      usageStats.monthRequests = 38000;
      console.log('🧪 Test: Simulated quota warning (38,000 requests)');
      return NextResponse.json({ 
        success: true, 
        message: 'Quota warning simulation activated',
        monthRequests: usageStats.monthRequests 
      });
    } else if (action === 'reset-quota') {
      // Reset quota to normal
      usageStats.monthRequests = 0;
      usageStats.totalRequests = 0;
      usageStats.todayRequests = 0;
      usageStats.weekRequests = 0;
      usageStats.cacheHits = 0;
      usageStats.cacheMisses = 0;
      usageStats.requestHistory = [];
      console.log('🧪 Test: Reset quota to 0');
      return NextResponse.json({ 
        success: true, 
        message: 'Quota reset to 0',
        monthRequests: usageStats.monthRequests 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in PUT request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}