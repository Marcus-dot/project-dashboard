// Wastage Assessment Types
export type ResourceType = 'budget' | 'hours' | 'materials' | 'equipment' | 'other'

export interface WastageAssessment {
    id: string
    user_id: string
    project_id: string | null
    company_id: string

    // Resource Details
    resource_type: ResourceType
    allocated: number
    used: number
    unit: string | null

    // Calculated Metrics
    wastage_amount: number
    wastage_percentage: number
    efficiency_score: number

    // Financial Impact
    cost_per_unit: number | null
    wastage_cost: number | null

    // Metadata
    assessment_name: string | null
    notes: string | null
    assessment_date: string
    created_at: string
    updated_at: string
}

export interface WastageAssessmentInput {
    project_id?: string
    resource_type: ResourceType
    allocated: number
    used: number
    unit?: string
    cost_per_unit?: number
    assessment_name?: string
    notes?: string
}

export interface WastageResult {
    wastage_amount: number
    wastage_percentage: number
    efficiency_score: number
    wastage_cost: number
    status: WastageStatus
    recommendations: string[]
}

export type WastageStatus = 'excellent' | 'good' | 'acceptable' | 'concerning' | 'critical'

// Resource type definitions
export const RESOURCE_TYPES: Record<ResourceType, { label: string; defaultUnit: string; color: string }> = {
    budget: {
        label: 'Budget',
        defaultUnit: 'USD',
        color: '#10b981' // green
    },
    hours: {
        label: 'Work Hours',
        defaultUnit: 'hours',
        color: '#3b82f6' // blue
    },
    materials: {
        label: 'Materials',
        defaultUnit: 'units',
        color: '#f59e0b' // orange
    },
    equipment: {
        label: 'Equipment',
        defaultUnit: 'units',
        color: '#8b5cf6' // purple
    },
    other: {
        label: 'Other Resources',
        defaultUnit: 'units',
        color: '#6b7280' // gray
    }
} as const

// Wastage thresholds and status
export const WASTAGE_THRESHOLDS = {
    excellent: { min: 0, max: 5, label: 'Excellent', color: '#10b981' },      // 0-5%
    good: { min: 5, max: 10, label: 'Good', color: '#3b82f6' },               // 5-10%
    acceptable: { min: 10, max: 20, label: 'Acceptable', color: '#f59e0b' },  // 10-20%
    concerning: { min: 20, max: 35, label: 'Concerning', color: '#f97316' }, // 20-35%
    critical: { min: 35, max: 100, label: 'Critical', color: '#ef4444' }      // 35%+
} as const

// Calculate wastage metrics
export function calculateWastageMetrics(allocated: number, used: number, costPerUnit?: number): WastageResult {
    // Prevent division by zero
    if (allocated === 0) {
        return {
            wastage_amount: 0,
            wastage_percentage: 0,
            efficiency_score: 0,
            wastage_cost: 0,
            status: 'excellent',
            recommendations: ['No resources allocated']
        }
    }

    const wastageAmount = Math.max(0, allocated - used)
    const wastagePercentage = (wastageAmount / allocated) * 100
    const efficiencyScore = Math.min(100, (used / allocated) * 100)
    const wastageCost = costPerUnit ? wastageAmount * costPerUnit : 0

    // Determine status
    let status: WastageStatus = 'excellent'
    if (wastagePercentage >= WASTAGE_THRESHOLDS.critical.min) status = 'critical'
    else if (wastagePercentage >= WASTAGE_THRESHOLDS.concerning.min) status = 'concerning'
    else if (wastagePercentage >= WASTAGE_THRESHOLDS.acceptable.min) status = 'acceptable'
    else if (wastagePercentage >= WASTAGE_THRESHOLDS.good.min) status = 'good'

    // Generate recommendations
    const recommendations = getWastageRecommendations(wastagePercentage, status, efficiencyScore)

    return {
        wastage_amount: wastageAmount,
        wastage_percentage: wastagePercentage,
        efficiency_score: efficiencyScore,
        wastage_cost: wastageCost,
        status,
        recommendations
    }
}

// Generate recommendations based on wastage
export function getWastageRecommendations(
    wastagePercentage: number,
    status: WastageStatus,
    efficiencyScore: number
): string[] {
    const recommendations: string[] = []

    if (status === 'critical') {
        recommendations.push('CRITICAL: Immediate action required')
        recommendations.push('Conduct urgent resource allocation review')
        recommendations.push('Implement strict monitoring and approval processes')
        recommendations.push('Consider project scope reduction or reallocation')
    } else if (status === 'concerning') {
        recommendations.push('WARNING: High wastage detected - review resource planning')
        recommendations.push('Analyze root causes of resource underutilization')
        recommendations.push('Implement better forecasting and tracking')
        recommendations.push('Set up weekly resource utilization reviews')
    } else if (status === 'acceptable') {
        recommendations.push('MODERATE: Room for improvement')
        recommendations.push('Fine-tune resource allocation estimates')
        recommendations.push('Monitor trends to prevent further increases')
        recommendations.push('Share best practices from high-performing projects')
    } else if (status === 'good') {
        recommendations.push('GOOD: Maintain current practices')
        recommendations.push('Document processes for future projects')
        recommendations.push('Continue monitoring resource utilization')
    } else {
        recommendations.push('EXCELLENT: Outstanding resource efficiency')
        recommendations.push('Share your allocation strategy with the team')
        recommendations.push('Consider this as a benchmark for other projects')
    }

    // Over-allocation warning
    if (efficiencyScore > 100) {
        recommendations.unshift('WARNING: Resources exceeded allocation - may indicate under-budgeting')
    }

    return recommendations
}

// Get wastage status details
export function getWastageStatus(percentage: number): { status: WastageStatus; color: string; label: string } {
    if (percentage >= WASTAGE_THRESHOLDS.critical.min) {
        return { status: 'critical', color: WASTAGE_THRESHOLDS.critical.color, label: WASTAGE_THRESHOLDS.critical.label }
    } else if (percentage >= WASTAGE_THRESHOLDS.concerning.min) {
        return { status: 'concerning', color: WASTAGE_THRESHOLDS.concerning.color, label: WASTAGE_THRESHOLDS.concerning.label }
    } else if (percentage >= WASTAGE_THRESHOLDS.acceptable.min) {
        return { status: 'acceptable', color: WASTAGE_THRESHOLDS.acceptable.color, label: WASTAGE_THRESHOLDS.acceptable.label }
    } else if (percentage >= WASTAGE_THRESHOLDS.good.min) {
        return { status: 'good', color: WASTAGE_THRESHOLDS.good.color, label: WASTAGE_THRESHOLDS.good.label }
    } else {
        return { status: 'excellent', color: WASTAGE_THRESHOLDS.excellent.color, label: WASTAGE_THRESHOLDS.excellent.label }
    }
}
