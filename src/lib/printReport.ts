// Print utilities for route calculation results

export interface PrintableReport {
  title: string;
  generatedAt: string;
  summary: {
    totalDistance: number;
    totalCost: number;
    rate: number;
    roundTripCost: number;
    waypointCount: number;
  };
  route: {
    origin: string;
    destination: string;
    waypoints: string[];
  };
  breakdown: Array<{
    from: string;
    to: string;
    distance: number;
    cost: number;
    segment: number;
  }>;
  additionalInfo: {
    provider: string;
    calculatedOn: string;
    cacheUsed: boolean;
  };
}

// Generate printable HTML content
export function generatePrintHTML(data: {
  distance: number;
  cost: number;
  rate: string;
  routeDetails?: any;
  sekolahMula: string;
  sekolahDestinasi: string;
  waypoints: string[];
}): string {
  const { distance, cost, rate, routeDetails, sekolahMula, sekolahDestinasi, waypoints } = data;
  const roundTripCost = cost * 2;
  const currentDate = new Date().toLocaleString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Pengiraan Jarak & Kos Perjalanan</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
        }
        
        .report-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        
        .header .subtitle {
            color: #64748b;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .summary-card.cost {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-left-color: #22c55e;
        }
        
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
        }
        
        .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        
        .summary-card .unit {
            font-size: 16px;
            color: #64748b;
            margin-top: 5px;
        }
        
        .route-section {
            margin-bottom: 30px;
        }
        
        .route-section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .route-overview {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .route-point {
            display: flex;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #94a3b8;
        }
        
        .route-point.origin { border-left-color: #3b82f6; }
        .route-point.waypoint { border-left-color: #8b5cf6; }
        .route-point.destination { border-left-color: #22c55e; }
        
        .route-point .icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .route-point.origin .icon { background: #3b82f6; }
        .route-point.waypoint .icon { background: #8b5cf6; }
        .route-point.destination .icon { background: #22c55e; }
        
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .breakdown-table th,
        .breakdown-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .breakdown-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
        }
        
        .breakdown-table tr:hover {
            background: #f8fafc;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-top: 30px;
        }
        
        .info-item {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
        }
        
        .info-item .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-item .value {
            font-weight: 600;
            color: #334155;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        
        .print-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
        }
        
        .print-button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>Laporan Pengiraan Jarak & Kos Perjalanan</h1>
            <p class="subtitle">Sistem Kalkulator Perjalanan Antara Sekolah</p>
            <p class="subtitle">Dijana pada: ${currentDate}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Jarak Pemanduan</h3>
                <p class="value" style="color: #3b82f6;">${distance.toFixed(2)}</p>
                <p class="unit">kilometer</p>
            </div>
            <div class="summary-card cost">
                <h3>Anggaran Kos (Sehala)</h3>
                <p class="value" style="color: #22c55e;">RM ${cost.toFixed(2)}</p>
                <p class="unit">ringgit</p>
            </div>
        </div>

        <div class="route-section">
            <h2>📍 Maklumat Perjalanan</h2>
            <div class="route-overview">
                <div class="route-point origin">
                    <div class="icon"></div>
                    <div>
                        <strong>Titik Mula:</strong><br>
                        ${sekolahMula}
                    </div>
                </div>
                
                ${waypoints.map((waypoint, index) => `
                    <div class="route-point waypoint">
                        <div class="icon"></div>
                        <div>
                            <strong>Destinasi ${index + 1}:</strong><br>
                            ${waypoint}
                        </div>
                    </div>
                `).join('')}
                
                <div class="route-point destination">
                    <div class="icon"></div>
                    <div>
                        <strong>Destinasi Akhir:</strong><br>
                        ${sekolahDestinasi}
                    </div>
                </div>
            </div>
        </div>

        ${routeDetails?.legs && routeDetails.legs.length > 1 ? `
        <div class="route-section">
            <h2>🗺️ Pecahan Perjalanan</h2>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Segmen</th>
                        <th>Dari</th>
                        <th>Ke</th>
                        <th>Jarak (km)</th>
                        <th>Kos (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    ${routeDetails.legs.map((leg: any, index: number) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${leg.from}</td>
                            <td>${leg.to}</td>
                            <td>${leg.distance_km.toFixed(2)}</td>
                            <td>RM ${(leg.distance_km * parseFloat(rate)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr style="background: #f1f5f9; font-weight: bold;">
                        <td colspan="3">JUMLAH KESELURUHAN</td>
                        <td>${distance.toFixed(2)} km</td>
                        <td>RM ${cost.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="info-grid">
            <div class="info-item">
                <div class="label">Kadar Perbatuan</div>
                <div class="value">RM ${rate}/km</div>
            </div>
            <div class="info-item">
                <div class="label">Pergi & Balik</div>
                <div class="value">RM ${roundTripCost.toFixed(2)}</div>
            </div>
            <div class="info-item">
                <div class="label">Destinasi Perantaraan</div>
                <div class="value">${waypoints.length} lokasi</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Sistem Kalkulator Jarak & Kos Perjalanan</strong></p>
            <p>Laporan ini dijana secara automatik berdasarkan data Google Maps Directions API</p>
            ${routeDetails?.provider ? `<p>Penyedia Data: ${routeDetails.provider}</p>` : ''}
        </div>
    </div>

    <button class="print-button no-print" onclick="window.print()">
        🖨️ Cetak Laporan
    </button>

    <script>
        // Auto-focus for better print experience
        window.onload = function() {
            console.log('📄 Print report loaded successfully');
        };
    </script>
</body>
</html>`;

  return html;
}

// Function to open print preview
export function openPrintReport(data: {
  distance: number;
  cost: number;
  rate: string;
  routeDetails?: any;
  sekolahMula: string;
  sekolahDestinasi: string;
  waypoints: string[];
}): void {
  const htmlContent = generatePrintHTML(data);
  
  // Create new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-focus the print window
    printWindow.focus();
    
    console.log('📄 Print report opened in new window');
  } else {
    // Fallback: download as HTML file
    downloadAsHTML(htmlContent, `laporan-perjalanan-${new Date().toISOString().split('T')[0]}.html`);
  }
}

// Function to download report as HTML file
export function downloadAsHTML(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📄 Report downloaded as: ${filename}`);
}