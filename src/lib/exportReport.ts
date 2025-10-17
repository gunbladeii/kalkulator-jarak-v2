// Export utilities for route calculation results

export interface RouteData {
  distance: number;
  cost: number;
  rate: string;
  routeDetails?: any;
  sekolahMula: string;
  sekolahDestinasi: string;
  waypoints: string[];
}

// Export as CSV
export function exportAsCSV(data: RouteData): void {
  const roundTripCost = data.cost * 2;
  const currentDate = new Date().toLocaleString('ms-MY');
  
  let csvContent = 'Laporan Pengiraan Jarak & Kos Perjalanan\n';
  csvContent += `Dijana pada: ${currentDate}\n\n`;
  
  // Summary data
  csvContent += 'RINGKASAN PERJALANAN\n';
  csvContent += 'Jenis,Nilai,Unit\n';
  csvContent += `Jarak Pemanduan,${data.distance.toFixed(2)},kilometer\n`;
  csvContent += `Kos Sehala,${data.cost.toFixed(2)},ringgit\n`;
  csvContent += `Kos Pergi Balik,${roundTripCost.toFixed(2)},ringgit\n`;
  csvContent += `Kadar Perbatuan,${data.rate},ringgit/km\n`;
  csvContent += `Destinasi Perantaraan,${data.waypoints.length},lokasi\n\n`;
  
  // Route details
  csvContent += 'MAKLUMAT LALUAN\n';
  csvContent += 'Jenis,Lokasi\n';
  csvContent += `Titik Mula,"${data.sekolahMula}"\n`;
  
  data.waypoints.forEach((waypoint, index) => {
    csvContent += `Destinasi ${index + 1},"${waypoint}"\n`;
  });
  
  csvContent += `Destinasi Akhir,"${data.sekolahDestinasi}"\n\n`;
  
  // Breakdown if available
  if (data.routeDetails?.legs && data.routeDetails.legs.length > 1) {
    csvContent += 'PECAHAN PERJALANAN\n';
    csvContent += 'Segmen,Dari,Ke,Jarak (km),Kos (RM)\n';
    
    data.routeDetails.legs.forEach((leg: any, index: number) => {
      csvContent += `${index + 1},"${leg.from}","${leg.to}",${leg.distance_km.toFixed(2)},${(leg.distance_km * parseFloat(data.rate)).toFixed(2)}\n`;
    });
    
    csvContent += `JUMLAH,-,-,${data.distance.toFixed(2)},${data.cost.toFixed(2)}\n`;
  }
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-perjalanan-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📊 Report exported as CSV');
}

// Export as JSON
export function exportAsJSON(data: RouteData): void {
  const exportData = {
    title: 'Laporan Pengiraan Jarak & Kos Perjalanan',
    generatedAt: new Date().toISOString(),
    summary: {
      totalDistance: data.distance,
      totalCost: data.cost,
      roundTripCost: data.cost * 2,
      rate: parseFloat(data.rate),
      waypointCount: data.waypoints.length
    },
    route: {
      origin: data.sekolahMula,
      destination: data.sekolahDestinasi,
      waypoints: data.waypoints
    },
    breakdown: data.routeDetails?.legs?.map((leg: any, index: number) => ({
      segment: index + 1,
      from: leg.from,
      to: leg.to,
      distance: leg.distance_km,
      cost: leg.distance_km * parseFloat(data.rate)
    })) || [],
    metadata: {
      provider: data.routeDetails?.provider || 'Google Maps',
      calculatedOn: new Date().toLocaleString('ms-MY'),
      currency: 'MYR'
    }
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-perjalanan-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📊 Report exported as JSON');
}