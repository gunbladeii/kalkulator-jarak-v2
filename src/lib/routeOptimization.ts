// Route optimization utilities for finding the shortest path between waypoints
// Implements Traveling Salesman Problem (TSP) solutions

export interface Location {
  name: string;
  coordinates?: { lat: number; lng: number };
}

export interface OptimizedRoute {
  optimizedOrder: string[];
  originalOrder: string[];
  distanceSaved: number;
  percentageSaved: number;
  totalOptimizedDistance: number;
  totalOriginalDistance: number;
}

export interface DistanceMatrix {
  [key: string]: {
    [key: string]: {
      distance: number;
      duration: number;
    };
  };
}

// Calculate distance matrix between all locations
export async function calculateDistanceMatrix(locations: Location[]): Promise<DistanceMatrix> {
  const matrix: DistanceMatrix = {};
  
  // Initialize matrix
  locations.forEach(loc1 => {
    matrix[loc1.name] = {};
    locations.forEach(loc2 => {
      matrix[loc1.name][loc2.name] = { distance: 0, duration: 0 };
    });
  });

  // Calculate distances between all pairs
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const origin = locations[i].name;
      const destination = locations[j].name;
      
      try {
        // Call Google Maps Distance Matrix API
        const response = await fetch('/api/distance-matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origins: [origin],
            destinations: [destination]
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.elements?.[0]?.status === 'OK') {
          const element = data.elements[0];
          const distance = element.distance.value / 1000; // Convert to km
          const duration = element.duration.value; // seconds
          
          // Matrix is symmetric
          matrix[origin][destination] = { distance, duration };
          matrix[destination][origin] = { distance, duration };
        }
      } catch (error) {
        console.error(`Error calculating distance between ${origin} and ${destination}:`, error);
        // Fallback to Haversine distance if API fails
        if (locations[i].coordinates && locations[j].coordinates) {
          const distance = calculateHaversineDistance(
            locations[i].coordinates!,
            locations[j].coordinates!
          );
          matrix[origin][destination] = { distance, duration: distance * 60 }; // Estimate 60s per km
          matrix[destination][origin] = { distance, duration: distance * 60 };
        }
      }
    }
  }
  
  return matrix;
}

// Haversine formula for calculating distance between coordinates
function calculateHaversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Optimize route using Nearest Neighbor algorithm (good for small sets)
export function optimizeRouteNearestNeighbor(
  origin: string,
  destination: string,
  waypoints: string[],
  distanceMatrix: DistanceMatrix
): OptimizedRoute {
  if (waypoints.length === 0) {
    return {
      optimizedOrder: [origin, destination],
      originalOrder: [origin, destination],
      distanceSaved: 0,
      percentageSaved: 0,
      totalOptimizedDistance: distanceMatrix[origin][destination]?.distance || 0,
      totalOriginalDistance: distanceMatrix[origin][destination]?.distance || 0
    };
  }

  // Original order calculation
  const originalOrder = [origin, ...waypoints, destination];
  const originalDistance = calculateTotalDistance(originalOrder, distanceMatrix);

  // Nearest Neighbor optimization
  const unvisited = [...waypoints];
  const optimizedOrder = [origin];
  let currentLocation = origin;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    unvisited.forEach((location, index) => {
      const distance = distanceMatrix[currentLocation][location]?.distance || Infinity;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nearestLocation = unvisited.splice(nearestIndex, 1)[0];
    optimizedOrder.push(nearestLocation);
    currentLocation = nearestLocation;
  }

  optimizedOrder.push(destination);
  const optimizedDistance = calculateTotalDistance(optimizedOrder, distanceMatrix);

  const distanceSaved = originalDistance - optimizedDistance;
  const percentageSaved = originalDistance > 0 ? (distanceSaved / originalDistance) * 100 : 0;

  return {
    optimizedOrder,
    originalOrder,
    distanceSaved,
    percentageSaved,
    totalOptimizedDistance: optimizedDistance,
    totalOriginalDistance: originalDistance
  };
}

// Calculate total distance for a given route
function calculateTotalDistance(route: string[], distanceMatrix: DistanceMatrix): number {
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    totalDistance += distanceMatrix[from][to]?.distance || 0;
  }
  
  return totalDistance;
}

// Advanced: 2-opt optimization for better results (good for larger sets)
export function optimizeRoute2Opt(
  origin: string,
  destination: string,
  waypoints: string[],
  distanceMatrix: DistanceMatrix
): OptimizedRoute {
  if (waypoints.length === 0) {
    return optimizeRouteNearestNeighbor(origin, destination, waypoints, distanceMatrix);
  }

  // Start with nearest neighbor solution
  const currentSolution = optimizeRouteNearestNeighbor(origin, destination, waypoints, distanceMatrix);
  let route = [...currentSolution.optimizedOrder];
  let improved = true;

  // 2-opt improvement
  while (improved) {
    improved = false;
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        // Try swapping edges
        const newRoute = [...route];
        
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, j - i + 1, ...segment);
        
        const newDistance = calculateTotalDistance(newRoute, distanceMatrix);
        const currentDistance = calculateTotalDistance(route, distanceMatrix);
        
        if (newDistance < currentDistance) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  const originalOrder = [origin, ...waypoints, destination];
  const originalDistance = calculateTotalDistance(originalOrder, distanceMatrix);
  const optimizedDistance = calculateTotalDistance(route, distanceMatrix);
  
  const distanceSaved = originalDistance - optimizedDistance;
  const percentageSaved = originalDistance > 0 ? (distanceSaved / originalDistance) * 100 : 0;

  return {
    optimizedOrder: route,
    originalOrder,
    distanceSaved,
    percentageSaved,
    totalOptimizedDistance: optimizedDistance,
    totalOriginalDistance: originalDistance
  };
}

// Smart route optimization - chooses best algorithm based on waypoint count
export function optimizeRouteIntelligent(
  origin: string,
  destination: string,
  waypoints: string[],
  distanceMatrix: DistanceMatrix
): OptimizedRoute {
  if (waypoints.length <= 1) {
    return optimizeRouteNearestNeighbor(origin, destination, waypoints, distanceMatrix);
  } else if (waypoints.length <= 8) {
    return optimizeRoute2Opt(origin, destination, waypoints, distanceMatrix);
  } else {
    // For larger sets, use nearest neighbor (faster)
    return optimizeRouteNearestNeighbor(origin, destination, waypoints, distanceMatrix);
  }
}