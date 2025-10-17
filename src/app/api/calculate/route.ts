import { supabase } from '@/lib/supabaseClient';
import { apiCache } from '@/lib/apiCache';
import { calculateRouteWithFallback } from '@/lib/alternativeRouting';
import { calculateDistanceMatrix, optimizeRouteIntelligent } from '@/lib/routeOptimization';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Dapatkan nama sekolah dari frontend (dengan waypoints optional dan optimize parameter)
    const { sekolahMula, sekolahDestinasi, waypoints = [], optimizeRoute = true } = await request.json();

    if (!sekolahMula || !sekolahDestinasi) {
      return NextResponse.json({ error: 'Nama sekolah mula dan destinasi diperlukan.' }, { status: 400 });
    }

    console.log(`🗺️ Calculating route: ${sekolahMula} → ${waypoints.length ? waypoints.join(' → ') + ' → ' : ''}${sekolahDestinasi}`);
    console.log(`🧠 Route optimization: ${optimizeRoute ? 'ENABLED' : 'DISABLED'}`);
    console.log('🔧 Using database coordinates lookup...');  // Added this line to trigger recompile

    // Check cache first to save API calls (include optimization in cache key)
    const cacheKey = apiCache.generateKey(sekolahMula, sekolahDestinasi, waypoints, optimizeRoute ? 'optimized' : 'sequential');
    const cachedResult = apiCache.get(cacheKey);
    
    if (cachedResult) {
      console.log(`🎯 Cache hit! Saved Google API call`);
      
      // Track usage (cached)
      await fetch(`${request.url.replace('/api/calculate', '/api/usage-stats')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: `${sekolahMula} → ${sekolahDestinasi}`,
          cached: true,
          waypoints: waypoints.length,
          optimized: optimizeRoute
        })
      }).catch(() => {}); // Silent fail for tracking
      
      return NextResponse.json(cachedResult);
    }

    // 2. Dapatkan koordinat dari Supabase untuk semua sekolah
    const allSchools = [sekolahMula, ...waypoints.filter((w: string) => w && w.trim()), sekolahDestinasi];
    
    // Enable SSL bypass for development (same as search API)
    if (process.env.NODE_ENV === 'development') {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }
    
    const schoolCoordinates = await Promise.all(
      allSchools.map(async (schoolName) => {
        console.log(`🔍 Looking up coordinates for: "${schoolName}"`);
        
        // Use direct HTTP API call (same as search API) instead of Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error(`Missing Supabase configuration`);
        }
        
        // Try exact match first with direct HTTP
        const exactUrl = `${supabaseUrl}/rest/v1/sekolah?select=latitud,longitud,nama_sekolah&nama_sekolah=eq.${encodeURIComponent(schoolName)}&limit=1`;
        
        try {
          const exactResponse = await fetch(exactUrl, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (exactResponse.ok) {
            const exactData = await exactResponse.json();
            if (exactData && exactData.length > 0) {
              console.log(`✅ Found exact match via HTTP: "${exactData[0].nama_sekolah}"`);
              return {
                name: schoolName,
                lat: exactData[0].latitud,
                lng: exactData[0].longitud,
                coordinate: `${exactData[0].latitud},${exactData[0].longitud}`
              };
            }
          }
        } catch (error) {
          console.log(`❌ Exact HTTP match failed: ${error}`);
        }
        
        // If exact match fails, try partial match with direct HTTP
        console.log(`❌ Exact match failed for "${schoolName}", trying partial match...`);
        
        const partialUrl = `${supabaseUrl}/rest/v1/sekolah?select=latitud,longitud,nama_sekolah&nama_sekolah=ilike.*${encodeURIComponent(schoolName)}*&limit=1`;
        
        try {
          const partialResponse = await fetch(partialUrl, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (partialResponse.ok) {
            const partialData = await partialResponse.json();
            if (partialData && partialData.length > 0) {
              console.log(`✅ Found partial match via HTTP: "${partialData[0].nama_sekolah}"`);
              return {
                name: schoolName,
                lat: partialData[0].latitud,
                lng: partialData[0].longitud,
                coordinate: `${partialData[0].latitud},${partialData[0].longitud}`
              };
            }
          }
        } catch (error) {
          console.log(`❌ Partial HTTP match failed: ${error}`);
        }
        
        // If still no match, try location-based search
        const locationWords = ['LUTONG', 'MIRI', 'BINTULU', 'TUDAN', 'KUCHING', 'SIBU', 'SAMARAHAN'];
        const foundLocation = locationWords.find(loc => schoolName.toUpperCase().includes(loc));
        
        if (foundLocation) {
          console.log(`🔄 Trying location-based search for: "${foundLocation}"`);
          const locationUrl = `${supabaseUrl}/rest/v1/sekolah?select=latitud,longitud,nama_sekolah&nama_sekolah=ilike.*${foundLocation}*&limit=1`;
          
          try {
            const locationResponse = await fetch(locationUrl, {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              if (locationData && locationData.length > 0) {
                console.log(`✅ Found location match via HTTP: "${locationData[0].nama_sekolah}"`);
                return {
                  name: schoolName,
                  lat: locationData[0].latitud,
                  lng: locationData[0].longitud,
                  coordinate: `${locationData[0].latitud},${locationData[0].longitud}`
                };
              }
            }
          } catch (error) {
            console.log(`❌ Location HTTP match failed: ${error}`);
          }
        }
        
        throw new Error(`Tidak dapat mencari koordinat untuk sekolah: ${schoolName}`);
      })
    );

    // 3. Route Optimization (if enabled and waypoints exist)
    let optimizedOrder = [sekolahMula, ...waypoints.filter((w: string) => w && w.trim()), sekolahDestinasi];
    let routeOptimization = null;

    if (optimizeRoute && waypoints.length > 0) {
      console.log(`🧠 Optimizing route with ${waypoints.length} waypoints...`);
      
      try {
        // Calculate distance matrix for optimization
        const locations = schoolCoordinates.map(coord => ({
          name: coord.name,
          coordinates: { lat: coord.lat, lng: coord.lng }
        }));
        
        const distanceMatrix = await calculateDistanceMatrix(locations);
        
        // Optimize the route
        const optimization = optimizeRouteIntelligent(
          sekolahMula,
          sekolahDestinasi,
          waypoints.filter((w: string) => w && w.trim()),
          distanceMatrix
        );
        
        routeOptimization = optimization;
        optimizedOrder = optimization.optimizedOrder;
        
        console.log(`🎯 Route optimized! Saved ${optimization.distanceSaved.toFixed(2)}km (${optimization.percentageSaved.toFixed(1)}%)`);
        console.log(`📍 Optimized order: ${optimization.optimizedOrder.join(' → ')}`);
        
      } catch (optimizeError) {
        console.warn(`⚠️ Route optimization failed, using original order:`, optimizeError);
        // Continue with original order if optimization fails
      }
    }

    // 4. Rebuild coordinates based on optimized order
    const optimizedCoordinates = await Promise.all(
      optimizedOrder.map(async (schoolName) => {
        const { data, error } = await supabase
          .from('sekolah')
          .select('latitud, longitud, nama_sekolah')
          .eq('nama_sekolah', schoolName)
          .single();

        if (error || !data) {
          throw new Error(`Tidak dapat mencari koordinat untuk sekolah: ${schoolName}`);
        }

        return {
          name: schoolName,
          lat: data.latitud,
          lng: data.longitud,
          coordinate: `${data.latitud},${data.longitud}`
        };
      })
    );

    const origin = optimizedCoordinates[0].coordinate;
    const destination = optimizedCoordinates[optimizedCoordinates.length - 1].coordinate;
    const waypointCoords = optimizedCoordinates.slice(1, -1).map(coord => coord.coordinate);

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // 5. Build Google Maps Directions API URL with optimized waypoints
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
    
    if (waypointCoords.length > 0) {
      const waypointsParam = waypointCoords.join('|');
      url += `&waypoints=${waypointsParam}`;
      console.log(`📍 Route includes ${waypointCoords.length} optimized waypoints`);
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.log(`❌ Google Maps failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
      
      // Try alternative providers as fallback
      if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
        console.log(`🔄 Quota exceeded or denied. Trying alternative providers...`);
        
        const fallbackResult = await calculateRouteWithFallback(origin, destination, waypointCoords);
        
        if (fallbackResult.success) {
          const result = {
            distance: fallbackResult.distance,
            legs: [{
              from: schoolCoordinates[0].name,
              to: schoolCoordinates[schoolCoordinates.length - 1].name,
              distance_km: fallbackResult.distance,
              duration: 'N/A',
              distance_text: `${fallbackResult.distance.toFixed(2)} km`
            }],
            total_legs: 1,
            waypoints_used: waypointCoords.length,
            schools: schoolCoordinates.map(s => s.name),
            provider: fallbackResult.provider,
            fallback_used: true,
            cached_at: new Date().toISOString()
          };
          
          // Cache fallback result too
          apiCache.set(cacheKey, result);
          
          // Track usage (fallback API call)
          await fetch(`${request.url.replace('/api/calculate', '/api/usage-stats')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route: `${sekolahMula} → ${sekolahDestinasi} (${fallbackResult.provider})`,
              cached: false,
              waypoints: waypoints.length
            })
          }).catch(() => {});
          
          return NextResponse.json(result);
        }
      }
      
      return NextResponse.json({ 
        error: 'Semua sistem pengiraan jarak tidak dapat mengira laluan.', 
        details: data.error_message || data.status,
        quota_exceeded: data.status === 'OVER_QUERY_LIMIT'
      }, { status: 500 });
    }

    // 6. Calculate total distance from all legs
    const route = data.routes[0];
    let totalDistanceMeters = 0;
    const legDetails = [];

    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      totalDistanceMeters += leg.distance.value;
      
      legDetails.push({
        from: optimizedCoordinates[i].name,
        to: optimizedCoordinates[i + 1].name,
        distance_km: (leg.distance.value / 1000),
        duration: leg.duration.text,
        distance_text: leg.distance.text
      });
    }

    const totalDistanceKm = totalDistanceMeters / 1000;

    console.log(`✅ Route calculated: ${totalDistanceKm.toFixed(2)}km total distance`);

    // 7. Return comprehensive route data with optimization info
    const result = { 
      distance: totalDistanceKm,
      legs: legDetails,
      total_legs: route.legs.length,
      waypoints_used: waypointCoords.length,
      schools: optimizedCoordinates.map(s => s.name),
      provider: 'Google Maps',
      fallback_used: false,
      cached_at: new Date().toISOString(),
      // Add optimization data
      optimization: routeOptimization ? {
        enabled: true,
        original_order: routeOptimization.originalOrder,
        optimized_order: routeOptimization.optimizedOrder,
        distance_saved: routeOptimization.distanceSaved,
        percentage_saved: routeOptimization.percentageSaved,
        original_total_distance: routeOptimization.totalOriginalDistance,
        optimized_total_distance: routeOptimization.totalOptimizedDistance
      } : {
        enabled: optimizeRoute,
        applied: false,
        reason: waypoints.length === 0 ? 'No waypoints to optimize' : 'Optimization disabled'
      }
    };

    // Cache the result to save future API calls
    apiCache.set(cacheKey, result);

    // Track usage (not cached - actual API call made)
    await fetch(`${request.url.replace('/api/calculate', '/api/usage-stats')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: `${sekolahMula} → ${sekolahDestinasi}`,
        cached: false,
        waypoints: waypoints.length
      })
    }).catch(() => {}); // Silent fail for tracking

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ralat dalaman server.' }, { status: 500 });
  }
}