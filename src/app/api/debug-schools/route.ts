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

    const { data: allSchools, error: allError } = await supabase
      .from('sekolah')
      .select('id, nama_sekolah, latitud, longitud')
      .or(`nama_sekolah.ilike.%lutong%,nama_sekolah.ilike.%miri%,nama_sekolah.ilike.%bintulu%,nama_sekolah.ilike.%tudan%`)
      .limit(20);

    return NextResponse.json({
      query: query,
      exactMatch: {
        found: !!exactMatch,
        data: exactMatch,
        error: exactError?.message
      },
      partialMatches: {
        found: partialMatches?.length || 0,
        data: partialMatches,
        error: partialError?.message
      },
      sampleSchools: {
        found: allSchools?.length || 0,
        data: allSchools,
        error: allError?.message
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