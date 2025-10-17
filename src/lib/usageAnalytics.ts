// Utility functions untuk export/analyze usage stats

export interface UsageReport {
  totalRequests: number;
  todayRequests: number;
  weekRequests: number;
  monthRequests: number;
  cacheHitRate: number;
  estimatedMonthlyCost: number;
  freeTierRemaining: number;
  requestHistory: Array<{
    timestamp: string;
    route: string;
    cached: boolean;
    waypoints: number;
  }>;
  generatedAt: string;
}

// Function to fetch and format usage stats
export async function getUsageReport(): Promise<UsageReport> {
  try {
    const response = await fetch('/api/usage-stats');
    const data = await response.json();
    
    return {
      totalRequests: data.stats.total_requests,
      todayRequests: data.stats.today_requests,
      weekRequests: data.stats.week_requests,
      monthRequests: data.stats.month_requests,
      cacheHitRate: parseFloat(data.stats.cache_hit_rate.replace('%', '')),
      estimatedMonthlyCost: parseFloat(data.stats.estimated_monthly_cost.replace('$', '')),
      freeTierRemaining: data.stats.free_tier_remaining,
      requestHistory: data.recent_requests,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch usage report: ${error}`);
  }
}

// Function to export usage stats to JSON file
export async function exportUsageToJSON(): Promise<string> {
  try {
    const report = await getUsageReport();
    const jsonContent = JSON.stringify(report, null, 2);
    
    // Create downloadable blob
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return jsonContent;
  } catch (error) {
    throw new Error(`Failed to export usage data: ${error}`);
  }
}

// Function to export usage stats to CSV format
export async function exportUsageToCSV(): Promise<string> {
  try {
    const report = await getUsageReport();
    
    // Create CSV content
    const headers = ['Timestamp', 'Route', 'Cached', 'Waypoints'];
    const csvRows = [
      headers.join(','),
      ...report.requestHistory.map(req => [
        req.timestamp,
        `"${req.route}"`, // Wrap in quotes to handle commas
        req.cached ? 'Yes' : 'No',
        req.waypoints
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create downloadable blob
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return csvContent;
  } catch (error) {
    throw new Error(`Failed to export CSV data: ${error}`);
  }
}

// Function to analyze usage patterns
export async function analyzeUsagePatterns(): Promise<{
  peakHours: string[];
  mostUsedRoutes: Array<{ route: string; count: number }>;
  cacheEfficiency: number;
  projectedMonthlyCost: number;
}> {
  try {
    const report = await getUsageReport();
    
    // Analyze peak hours
    const hourCounts = new Map<number, number>();
    report.requestHistory.forEach(req => {
      const hour = new Date(req.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${hour + 1}:00`);
    
    // Analyze most used routes
    const routeCounts = new Map<string, number>();
    report.requestHistory.forEach(req => {
      routeCounts.set(req.route, (routeCounts.get(req.route) || 0) + 1);
    });
    
    const mostUsedRoutes = Array.from(routeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));
    
    // Calculate cache efficiency
    const cacheEfficiency = report.cacheHitRate;
    
    // Project monthly cost based on current usage
    const dailyAverage = report.totalRequests / 30; // Assume 30 days of data
    const projectedMonthly = dailyAverage * 30;
    const projectedMonthlyCost = projectedMonthly > 40000 
      ? ((projectedMonthly - 40000) / 1000) * 5 
      : 0;
    
    return {
      peakHours,
      mostUsedRoutes,
      cacheEfficiency,
      projectedMonthlyCost
    };
  } catch (error) {
    throw new Error(`Failed to analyze usage patterns: ${error}`);
  }
}

// Console logging functions for debugging
export async function logUsageStats(): Promise<void> {
  try {
    const report = await getUsageReport();
    console.log('📊 Usage Statistics Report:');
    console.log('═══════════════════════════');
    console.log(`Total Requests: ${report.totalRequests}`);
    console.log(`Today: ${report.todayRequests}`);
    console.log(`This Month: ${report.monthRequests}`);
    console.log(`Cache Hit Rate: ${report.cacheHitRate}%`);
    console.log(`Estimated Cost: $${report.estimatedMonthlyCost}`);
    console.log(`Free Tier Remaining: ${report.freeTierRemaining}`);
    console.log('═══════════════════════════');
    
    const analysis = await analyzeUsagePatterns();
    console.log('📈 Usage Analysis:');
    console.log(`Peak Hours: ${analysis.peakHours.join(', ')}`);
    console.log(`Most Used Routes:`, analysis.mostUsedRoutes);
    console.log(`Projected Monthly Cost: $${analysis.projectedMonthlyCost.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Failed to log usage stats:', error);
  }
}