import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  console.log('🔍 Debug exact names for:', query);

  try {
    // Get exact matches and partial matches for debugging
    const { data: exactMatch, error: exactError } = await supabase
      .from('sekolah')
      .select('id, nama_sekolah, latitud, longitud')
      .eq('nama_sekolah', query)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error on no match

    const { data: partialMatches, error: partialError } = await supabase
      .from('sekolah')
      .select('id, nama_sekolah, latitud, longitud')
      .ilike('nama_sekolah', `%${query}%`)
      .limit(10);

    // Analyze coordinates for validation issues
    const analyzeCoordinates = (school: any) => {
      const lat = school.latitud;
      const lng = school.longitud;
      
      const issues = [];
      
      // Check for null/undefined
      if (lat === null || lat === undefined) issues.push('LATITUDE_NULL');
      if (lng === null || lng === undefined) issues.push('LONGITUDE_NULL');
      
      // Check for zero values
      if (lat === 0) issues.push('LATITUDE_ZERO');
      if (lng === 0) issues.push('LONGITUDE_ZERO');
      
      // Check for invalid numbers
      if (typeof lat !== 'number' || isNaN(lat)) issues.push('LATITUDE_NOT_NUMBER');
      if (typeof lng !== 'number' || isNaN(lng)) issues.push('LONGITUDE_NOT_NUMBER');
      
      // Check latitude range (-90 to 90)
      if (lat < -90 || lat > 90) issues.push('LATITUDE_OUT_OF_RANGE');
      
      // Check longitude range (-180 to 180)  
      if (lng < -180 || lng > 180) issues.push('LONGITUDE_OUT_OF_RANGE');
      
      // Check Malaysia range (approximately)
      if (lat < 1.0 || lat > 7.5) issues.push('NOT_MALAYSIA_LATITUDE');
      if (lng < 99.0 || lng > 119.5) issues.push('NOT_MALAYSIA_LONGITUDE');
      
      return {
        ...school,
        coordinate_string: `${lat},${lng}`,
        issues: issues,
        is_valid: issues.length === 0,
        coordinate_analysis: {
          lat_type: typeof lat,
          lng_type: typeof lng,
          lat_value: lat,
          lng_value: lng
        }
      };
    };

    // Analyze coordinates
    const analyzedExact = exactMatch ? analyzeCoordinates(exactMatch) : null;
    const analyzedPartial = partialMatches ? partialMatches.map(analyzeCoordinates) : [];

    return NextResponse.json({
      query: query,
      exactMatch: {
        found: !!exactMatch,
        data: analyzedExact,
        error: exactError?.message
      },
      partialMatches: {
        found: partialMatches?.length || 0,
        data: analyzedPartial,
        error: partialError?.message
      },
      summary: {
        total_issues: [analyzedExact, ...analyzedPartial].filter(s => s && s.issues.length > 0).length,
        common_issues: [analyzedExact, ...analyzedPartial]
          .filter(s => s)
          .flatMap(s => s.issues)
          .reduce((acc: Record<string, number>, issue: string) => {
            acc[issue] = (acc[issue] || 0) + 1;
            return acc;
          }, {})
      },
      success: true
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }, 
      { status: 500 }
    );
  }
}