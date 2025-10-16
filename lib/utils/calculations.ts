// Re-export currency utilities for backward compatibility
export { formatCurrency, formatPercentage, formatCompactNumber } from './currency'
export type { Currency } from './currency'

export function calculateNPV(
  expectedRevenue: number,
  actualCosts: number,
  discountRate: number,
  durationMonths: number
): number {
  if (!expectedRevenue || !durationMonths) return 0

  const years = durationMonths / 12
  const rate = discountRate / 100

  const presentValue = expectedRevenue / Math.pow(1 + rate, years)
  const npv = presentValue - actualCosts

  return Math.round(npv * 100) / 100
}

export function calculateRiskScore(factors: {
  budgetVariance?: number
  scheduleDelay?: number
  resourceAvailability?: number
  complexity?: number
  stakeholderAlignment?: number
}): number {
  const weights = {
    budgetVariance: 0.25,
    scheduleDelay: 0.2,
    resourceAvailability: 0.2,
    complexity: 0.2,
    stakeholderAlignment: 0.15
  }

  let totalScore = 0
  let totalWeight = 0

  Object.entries(factors).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const weight = weights[key as keyof typeof weights]
      totalScore += value * weight
      totalWeight += weight
    }
  })

  if (totalWeight === 0) return 0

  const normalizedScore = (totalScore / totalWeight)
  return Math.min(100, Math.max(0, Math.round(normalizedScore)))
}

export function getRiskLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High Risk', color: 'red' }
  if (score >= 40) return { label: 'Medium Risk', color: 'yellow' }
  return { label: 'Low Risk', color: 'green' }
}

export function calculateResourceUtilization(
  resourceAllocation: Record<string, number>
): number {
  const values = Object.values(resourceAllocation)
  if (values.length === 0) return 0

  const average = values.reduce((sum, val) => sum + val, 0) / values.length
  return Math.round(average * 100) / 100
}