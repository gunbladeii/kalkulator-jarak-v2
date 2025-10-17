import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Simple test - get count of schools
    const { count, error } = await supabase
      .from('sekolah')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase test error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    console.log('✅ Supabase test successful, total schools:', count);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working',
      totalSchools: count 
    });

  } catch (error) {
    console.error('💥 Test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    }, { status: 500 });
  }
}