// Government Travel Allowance Rate Calculator
// Based on official government rate structure

export interface GovRateStructure {
  type: 'manual' | 'kereta' | 'motorsikal';
  totalDistance: number;
  totalCost: number;
  breakdown: {
    first500km: {
      distance: number;
      rate: number;
      cost: number;
    };
    beyond500km: {
      distance: number;
      rate: number;
      cost: number;
    };
  };
}

/**
 * Calculate government travel allowance based on official rates
 * @param totalDistanceKm Total distance in kilometers
 * @param vehicleType Type of vehicle: 'kereta' or 'motorsikal'
 * @returns Detailed breakdown of government rate calculation
 */
export function calculateGovernmentRate(
  totalDistanceKm: number, 
  vehicleType: 'kereta' | 'motorsikal'
): GovRateStructure {
  
  // Government rates (in RM per km)
  const rates = {
    kereta: {
      first500: 0.85,    // 85 sen/km for first 500km
      beyond500: 0.75    // 75 sen/km for 501km and beyond
    },
    motorsikal: {
      first500: 0.55,    // 55 sen/km for first 500km  
      beyond500: 0.45    // 45 sen/km for 501km and beyond
    }
  };

  const selectedRates = rates[vehicleType];
  
  let first500Distance = 0;
  let beyond500Distance = 0;
  let first500Cost = 0;
  let beyond500Cost = 0;

  if (totalDistanceKm <= 500) {
    // All distance within first 500km
    first500Distance = totalDistanceKm;
    first500Cost = first500Distance * selectedRates.first500;
  } else {
    // Distance exceeds 500km
    first500Distance = 500;
    beyond500Distance = totalDistanceKm - 500;
    
    first500Cost = first500Distance * selectedRates.first500;
    beyond500Cost = beyond500Distance * selectedRates.beyond500;
  }

  const totalCost = first500Cost + beyond500Cost;

  return {
    type: vehicleType,
    totalDistance: totalDistanceKm,
    totalCost,
    breakdown: {
      first500km: {
        distance: first500Distance,
        rate: selectedRates.first500,
        cost: first500Cost
      },
      beyond500km: {
        distance: beyond500Distance,
        rate: selectedRates.beyond500,
        cost: beyond500Cost
      }
    }
  };
}

/**
 * Get equivalent single rate for government calculation
 * This is for display purposes when showing "effective rate"
 */
export function getEquivalentSingleRate(
  totalDistanceKm: number,
  vehicleType: 'kereta' | 'motorsikal'
): number {
  const govCalc = calculateGovernmentRate(totalDistanceKm, vehicleType);
  return govCalc.totalCost / totalDistanceKm;
}

/**
 * Format government rate breakdown for display
 */
export function formatGovernmentRateBreakdown(calc: GovRateStructure): string {
  const { breakdown } = calc;
  
  let result = `🏛️ Kadar Kerajaan (${calc.type === 'kereta' ? 'Kereta' : 'Motorsikal'}):\n`;
  
  if (breakdown.first500km.distance > 0) {
    result += `• ${breakdown.first500km.distance.toFixed(1)} km pertama @ RM ${breakdown.first500km.rate} = RM ${breakdown.first500km.cost.toFixed(2)}\n`;
  }
  
  if (breakdown.beyond500km.distance > 0) {
    result += `• ${breakdown.beyond500km.distance.toFixed(1)} km seterusnya @ RM ${breakdown.beyond500km.rate} = RM ${breakdown.beyond500km.cost.toFixed(2)}\n`;
  }
  
  result += `📊 Jumlah: RM ${calc.totalCost.toFixed(2)}`;
  
  return result;
}

/**
 * Compare government rate vs manual rate
 */
export function compareRates(
  totalDistanceKm: number,
  manualRate: number,
  vehicleType: 'kereta' | 'motorsikal'
) {
  const govCalc = calculateGovernmentRate(totalDistanceKm, vehicleType);
  const manualCost = totalDistanceKm * manualRate;
  
  const difference = govCalc.totalCost - manualCost;
  const percentageDiff = ((difference / manualCost) * 100);
  
  return {
    government: govCalc,
    manual: {
      totalCost: manualCost,
      rate: manualRate
    },
    difference: {
      amount: difference,
      percentage: percentageDiff,
      governmentHigher: difference > 0
    }
  };
}