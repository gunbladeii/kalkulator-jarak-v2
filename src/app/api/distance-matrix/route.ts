import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { origins, destinations } = await request.json()

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return NextResponse.json({
        success: false,
        error: 'Origins and destinations must be arrays'
      }, { status: 400 })
    }

    // Google Maps Distance Matrix API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Google Maps API key not configured'
      }, { status: 500 })
    }

    // Prepare origins and destinations for Google API
    const originsParam = origins.map(encodeURIComponent).join('|')
    const destinationsParam = destinations.map(encodeURIComponent).join('|')

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${originsParam}&` +
      `destinations=${destinationsParam}&` +
      `units=metric&` +
      `mode=driving&` +
      `key=${apiKey}`

    console.log('🔍 Distance Matrix API call:', {
      origins: origins.length,
      destinations: destinations.length,
      timestamp: new Date().toISOString()
    })

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('❌ Distance Matrix API error:', data.status, data.error_message)
      return NextResponse.json({
        success: false,
        error: `Distance Matrix API error: ${data.status}`,
        details: data.error_message
      }, { status: 500 })
    }

    // Process the response
    const elements = data.rows[0]?.elements || []
    
    console.log('✅ Distance Matrix API success:', {
      elementsReturned: elements.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      elements,
      origins_addresses: data.origin_addresses,
      destination_addresses: data.destination_addresses,
      metadata: {
        provider: 'Google Maps Distance Matrix',
        timestamp: new Date().toISOString(),
        api_status: data.status
      }
    })

  } catch (error) {
    console.error('❌ Distance Matrix calculation error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate distance matrix',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}