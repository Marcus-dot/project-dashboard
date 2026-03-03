// Re-export currency utilities for backward compatibility
export { formatCurrency, formatPercentage, formatCompactNumber } from './currency'
export type { Currency } from './currency'

import { PeriodType, PERIOD_CONFIGS, periodsToYears } from '@/types/npv'

/**
 * Calculate Net Present Value (NPV) - ENHANCED WITH PERIOD SUPPORT
 * Formula: NPV = -I₀ + Σ(CFₜ / (1 + r)ᵗ)
 * 
 * @param initialInvestment - Upfront cost (e.g., 100000 ZMW)
 * @param discountRate - Annual discount rate as percentage (e.g., 10 for 10%)
 * @param cashFlows - Array of cash flows per period (e.g., [30000, 35000, 40000])
 * @param periodType - Type of period: 'years', 'quarters', 'months', or 'weeks' (default: 'years')
 * @returns NPV value (positive = viable, negative = not viable)
 */
export function calculateNPV(
  initialInvestment: number,
  discountRate: number,
  cashFlows: number[],
  periodType: PeriodType = 'years'
): number {
  let npv = -initialInvestment;

  for (let period = 0; period < cashFlows.length; period++) {
    // Convert period to years for discounting
    const yearsFromStart = periodsToYears(period + 1, periodType);
    npv += cashFlows[period] / Math.pow(1 + discountRate / 100, yearsFromStart);
  }

  return npv;
}

/**
 * Calculate cumulative NPV over time (for chart visualization)
 * Returns array of {period, value} points showing NPV accumulation
 * 
 * @param initialInvestment - Upfront cost
 * @param discountRate - Annual discount rate as percentage
 * @param cashFlows - Array of cash flows per period
 * @param periodType - Type of period: 'years', 'quarters', 'months', or 'weeks' (default: 'years')
 * @returns Array of cumulative NPV points for each period
 */
export function calculateCumulativeNPV(
  initialInvestment: number,
  discountRate: number,
  cashFlows: number[],
  periodType: PeriodType = 'years'
): Array<{ period: number; value: number }> {
  const points: Array<{ period: number; value: number }> = [
    { period: 0, value: -initialInvestment }
  ];

  let cumulative = -initialInvestment;

  for (let period = 0; period < cashFlows.length; period++) {
    // Convert period to years for discounting
    const yearsFromStart = periodsToYears(period + 1, periodType);
    const presentValue = cashFlows[period] / Math.pow(1 + discountRate / 100, yearsFromStart);
    cumulative += presentValue;
    points.push({ period: period + 1, value: cumulative });
  }

  return points;
}

/**
 * Legacy NPV calculation (kept for backward compatibility)
 * Use the new calculateNPV() for standard NPV calculations
 * 
 * @deprecated Use calculateNPV(initialInvestment, discountRate, cashFlows, periodType) instead
 */
export function calculateProjectNPV(
  expectedRevenue: number,
  actualCosts: number,
  discountRate: number,
  durationMonths: number
): number {
  if (!expectedRevenue || !durationMonths) return 0;

  const years = durationMonths / 12;
  const rate = discountRate / 100;

  const presentValue = expectedRevenue / Math.pow(1 + rate, years);
  const npv = presentValue - actualCosts;

  return Math.round(npv * 100) / 100;
}

/**
 * Get default discount rate based on country context
 * Zambia: 10% (reflecting Bank of Zambia rates + risk premium)
 * Other emerging markets: 8%
 * Developed markets: 5%
 * 
 * @param country - Country name or code (e.g., 'Zambia', 'ZM')
 * @returns Appropriate discount rate as percentage
 */
export function getDefaultDiscountRate(country?: string): number {
  if (!country) return 5;

  const countryUpper = country.toUpperCase();

  // Zambian context (high inflation environment)
  if (countryUpper === 'ZAMBIA' || countryUpper === 'ZM') {
    return 10;
  }

  // Other African countries with similar economic profiles
  const emergingMarkets = [
    'NIGERIA', 'KENYA', 'SOUTH AFRICA', 'GHANA', 'TANZANIA',
    'UGANDA', 'ZIMBABWE', 'MALAWI', 'BOTSWANA', 'MOZAMBIQUE',
    'RWANDA', 'ETHIOPIA', 'SENEGAL', 'COTE D\'IVOIRE'
  ];
  if (emergingMarkets.includes(countryUpper)) {
    return 8;
  }

  // Default for developed markets
  return 5;
}

/**
 * Calculate Risk Score with weighted factors
 * Score ranges from 0-100 (higher = riskier)
 * 
 * @param factors - Risk factors with values 0-100
 * @returns Weighted risk score (0-100)
 */
export function calculateRiskScore(factors: {
  budgetVariance?: number;
  scheduleDelay?: number;
  resourceAvailability?: number;
  complexity?: number;
  stakeholderAlignment?: number;
}): number {
  const weights = {
    budgetVariance: 0.25,
    scheduleDelay: 0.2,
    resourceAvailability: 0.2,
    complexity: 0.2,
    stakeholderAlignment: 0.15
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(factors).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const weight = weights[key as keyof typeof weights];
      totalScore += value * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 0;

  const normalizedScore = (totalScore / totalWeight);
  return Math.min(100, Math.max(0, Math.round(normalizedScore)));
}

/**
 * Get risk level label and color based on score
 * 
 * @param score - Risk score (0-100)
 * @returns Object with label and color for UI
 */
export function getRiskLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High Risk', color: 'red' };
  if (score >= 40) return { label: 'Medium Risk', color: 'yellow' };
  return { label: 'Low Risk', color: 'green' };
}

/**
 * Calculate Resource Utilization percentage
 * 
 * @param resourceAllocation - Object with resource allocations
 * @returns Average utilization percentage
 */
export function calculateResourceUtilization(
  resourceAllocation: Record<string, number>
): number {
  const values = Object.values(resourceAllocation);
  if (values.length === 0) return 0;

  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.round(average * 100) / 100;
}

/**
 * Calculate Wastage Percentage
 * Formula: Wastage % = (Allocated - Used) / Allocated * 100
 * 
 * @param allocated - Total allocated resources
 * @param used - Actual resources used
 * @returns Wastage percentage (0-100)
 */
export function calculateWastage(allocated: number, used: number): number {
  if (allocated === 0) return 0;

  const wastage = ((allocated - used) / allocated) * 100;
  return Math.max(0, Math.round(wastage * 100) / 100);
}

/**
 * Calculate Adjusted Profit with Wastage Impact
 * Formula: Adjusted Net = Gross Profit - (Wastage Cost)
 * 
 * @param grossProfit - Total gross profit
 * @param wastagePercentage - Wastage as percentage
 * @param totalCosts - Total project costs
 * @returns Adjusted profit after wastage
 */
export function calculateAdjustedProfit(
  grossProfit: number,
  wastagePercentage: number,
  totalCosts: number
): number {
  const wastageCost = (wastagePercentage / 100) * totalCosts;
  const adjustedProfit = grossProfit - wastageCost;
  return Math.round(adjustedProfit * 100) / 100;
}

/**
 * Get wastage severity level
 * 
 * @param wastagePercentage - Wastage percentage (0-100)
 * @returns Object with label and color for UI
 */
export function getWastageLevel(wastagePercentage: number): {
  label: string;
  color: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  if (wastagePercentage >= 30) {
    return { label: 'Critical Wastage', color: 'red', severity: 'critical' };
  }
  if (wastagePercentage >= 20) {
    return { label: 'High Wastage', color: 'orange', severity: 'high' };
  }
  if (wastagePercentage >= 10) {
    return { label: 'Moderate Wastage', color: 'yellow', severity: 'medium' };
  }
  return { label: 'Low Wastage', color: 'green', severity: 'low' };
}