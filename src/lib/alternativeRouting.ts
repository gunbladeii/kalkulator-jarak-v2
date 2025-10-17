// Alternative routing providers for backup when Google Maps quota exceeded

interface RouteProvider {
  name: string;
  calculate: (origin: string, destination: string, waypoints?: string[]) => Promise<{
    distance: number; // in kilometers
    provider: string;
    success: boolean;
    error?: string;
  }>;
}

// Haversine formula for direct distance calculation (fallback)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Parse coordinate string to lat/lng
function parseCoordinates(coord: string): { lat: number, lng: number } {
  const [lat, lng] = coord.split(',').map(Number);
  return { lat, lng };
}

// Provider 1: OpenRouteService (Free tier: 2000 requests/day)
const openRouteServiceProvider: RouteProvider = {
  name: 'OpenRouteService',
  calculate: async (origin: string, destination: string, waypoints = []) => {
    try {
      const apiKey = process.env.OPENROUTE_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouteService API key not configured');
      }

      const coordinates = [origin, ...waypoints, destination].map(coord => {
        const { lng, lat } = parseCoordinates(coord);
        return [lng, lat]; // ORS uses [lng, lat] format
      });

      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates,
          format: 'json'
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.routes || data.routes.length === 0) {
        throw new Error(data.error?.message || 'No routes found');
      }

      const distance = data.routes[0].summary.distance / 1000; // Convert m to km
      return {
        distance,
        provider: 'OpenRouteService',
        success: true
      };

    } catch (error) {
      return {
        distance: 0,
        provider: 'OpenRouteService',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Provider 2: MapBox (Free tier: 100,000 requests/month)
const mapboxProvider: RouteProvider = {
  name: 'Mapbox',
  calculate: async (origin: string, destination: string, waypoints = []) => {
    try {
      const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
      if (!apiKey) {
        throw new Error('Mapbox API key not configured');
      }

      const coordinates = [origin, ...waypoints, destination].map(coord => {
        const { lng, lat } = parseCoordinates(coord);
        return `${lng},${lat}`;
      }).join(';');

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${apiKey}&overview=false&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No routes found');
      }

      const distance = data.routes[0].distance / 1000; // Convert m to km
      return {
        distance,
        provider: 'Mapbox',
        success: true
      };

    } catch (error) {
      return {
        distance: 0,
        provider: 'Mapbox',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Provider 3: Haversine Distance (Always available fallback)
const haversineProvider: RouteProvider = {
  name: 'Haversine',
  calculate: async (origin: string, destination: string, waypoints = []) => {
    try {
      const coords = [origin, ...waypoints, destination].map(parseCoordinates);
      
      let totalDistance = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const dist = haversineDistance(
          coords[i].lat, coords[i].lng,
          coords[i + 1].lat, coords[i + 1].lng
        );
        totalDistance += dist;
      }

      // Add 25% buffer for road routing vs direct distance
      const roadDistance = totalDistance * 1.25;

      return {
        distance: roadDistance,
        provider: 'Haversine (Direct Distance + 25%)',
        success: true
      };

    } catch (error) {
      return {
        distance: 0,
        provider: 'Haversine',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Main function to try providers in order
export async function calculateRouteWithFallback(
  origin: string, 
  destination: string, 
  waypoints: string[] = []
): Promise<{
  distance: number;
  provider: string;
  success: boolean;
  error?: string;
  fallback_used: boolean;
}> {
  
  const providers = [
    // Primary: Google Maps (handled in main calculate API)
    // Fallbacks in order of preference:
    openRouteServiceProvider,
    mapboxProvider,
    haversineProvider // Always works as last resort
  ];

  console.log(`🔄 Trying alternative route providers for backup...`);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    console.log(`📍 Trying provider: ${provider.name}`);
    
    const result = await provider.calculate(origin, destination, waypoints);
    
    if (result.success) {
      console.log(`✅ Success with ${provider.name}: ${result.distance.toFixed(2)}km`);
      return {
        ...result,
        fallback_used: true
      };
    } else {
      console.log(`❌ Failed with ${provider.name}: ${result.error}`);
    }
  }

  // Should never reach here since Haversine always works
  return {
    distance: 0,
    provider: 'None',
    success: false,
    error: 'All providers failed',
    fallback_used: true
  };
}