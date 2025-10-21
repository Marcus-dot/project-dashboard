export type Priority = 'High' | 'Medium' | 'Low'
export type Status = 'Planning' | 'In progress' | 'Complete' | 'Paused' | 'Cancelled'
export type Scale = 'Short-term' | 'Medium-term' | 'Long-term'
export type UserRole = 'admin' | 'manager' | 'member'
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

export interface Project {
    id: string
    created_at: string
    updated_at: string
    name: string
    owner?: string
    details?: string
    duration?: number
    start_date?: string
    priority: Priority
    status: Status
    scale: Scale
    notes?: string
    user_id: string
    company_id: string
    created_by?: string
    budget?: number
    actual_costs?: number
    discount_rate?: number
    expected_revenue?: number
    npv?: number
    resource_allocation?: Record<string, number>
    resource_utilization?: number
    risk_score?: number
    risk_factors?: Record<string, any>

    // Calculator Links
    latest_npv_calculation_id?: string | null
    latest_risk_assessment_id?: string | null
    latest_wastage_assessment_id?: string | null

    // Health Score
    health_score?: number | null
    health_status?: HealthStatus | null
    health_updated_at?: string | null
}

export interface Company {
    id: string
    name: string
    access_code: string
    created_at: string
    created_by: string
    currency?: string
    country?: string
}

export interface Profile {
    id: string
    email: string
    full_name?: string
    company_id?: string
    role: UserRole
    created_at: string
    updated_at: string
}

// Health Score Configuration
export const HEALTH_THRESHOLDS = {
    excellent: { min: 80, max: 100, label: 'Excellent', color: '#10b981', bgColor: '#d1fae5' },
    good: { min: 65, max: 79, label: 'Good', color: '#3b82f6', bgColor: '#dbeafe' },
    fair: { min: 45, max: 64, label: 'Fair', color: '#f59e0b', bgColor: '#fef3c7' },
    poor: { min: 25, max: 44, label: 'Poor', color: '#f97316', bgColor: '#ffedd5' },
    critical: { min: 0, max: 24, label: 'Critical', color: '#ef4444', bgColor: '#fee2e2' }
} as const

// Get health status details from score
export function getHealthStatus(score: number | null | undefined): {
    status: HealthStatus
    label: string
    color: string
    bgColor: string
} {
    if (score === null || score === undefined) {
        return {
            status: 'fair',
            label: 'Unknown',
            color: '#6b7280',
            bgColor: '#f3f4f6'
        }
    }

    if (score >= HEALTH_THRESHOLDS.excellent.min) {
        return {
            status: 'excellent',
            label: HEALTH_THRESHOLDS.excellent.label,
            color: HEALTH_THRESHOLDS.excellent.color,
            bgColor: HEALTH_THRESHOLDS.excellent.bgColor
        }
    } else if (score >= HEALTH_THRESHOLDS.good.min) {
        return {
            status: 'good',
            label: HEALTH_THRESHOLDS.good.label,
            color: HEALTH_THRESHOLDS.good.color,
            bgColor: HEALTH_THRESHOLDS.good.bgColor
        }
    } else if (score >= HEALTH_THRESHOLDS.fair.min) {
        return {
            status: 'fair',
            label: HEALTH_THRESHOLDS.fair.label,
            color: HEALTH_THRESHOLDS.fair.color,
            bgColor: HEALTH_THRESHOLDS.fair.bgColor
        }
    } else if (score >= HEALTH_THRESHOLDS.poor.min) {
        return {
            status: 'poor',
            label: HEALTH_THRESHOLDS.poor.label,
            color: HEALTH_THRESHOLDS.poor.color,
            bgColor: HEALTH_THRESHOLDS.poor.bgColor
        }
    } else {
        return {
            status: 'critical',
            label: HEALTH_THRESHOLDS.critical.label,
            color: HEALTH_THRESHOLDS.critical.color,
            bgColor: HEALTH_THRESHOLDS.critical.bgColor
        }
    }
}

// Calculate health score client-side (mirrors database function)
export function calculateProjectHealthScore(project: Partial<Project>): number {
    let score = 50 // Start at neutral

    // NPV Component (0-30 points)
    if (project.npv !== undefined && project.npv !== null) {
        if (project.npv > 0) {
            score += 30
        } else if (project.npv >= -10000) {
            score += 15
        } else {
            score -= 10
        }
    }

    // Risk Component (0-25 points, inverse)
    if (project.risk_score !== undefined && project.risk_score !== null) {
        if (project.risk_score < 30) {
            score += 25
        } else if (project.risk_score < 50) {
            score += 15
        } else if (project.risk_score < 70) {
            score += 5
        } else {
            score -= 15
        }
    }

    // Status Component (0-15 points)
    switch (project.status) {
        case 'Complete':
            score += 15
            break
        case 'In progress':
            score += 10
            break
        case 'Planning':
            score += 5
            break
        case 'Paused':
            score -= 5
            break
        case 'Cancelled':
            score -= 15
            break
    }

    // Priority Component (0-10 points)
    switch (project.priority) {
        case 'High':
            score += 10
            break
        case 'Medium':
            score += 5
            break
        case 'Low':
            score += 0
            break
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score))
}

// Get health insights
export function getHealthInsights(project: Project): string[] {
    const insights: string[] = []
    const healthStatus = getHealthStatus(project.health_score)

    // Overall health insight
    if (healthStatus.status === 'critical') {
        insights.push('CRITICAL: This project requires immediate attention and intervention')
    } else if (healthStatus.status === 'poor') {
        insights.push('WARNING: Project performance is below acceptable levels')
    } else if (healthStatus.status === 'fair') {
        insights.push('CAUTION: Project needs improvement in key areas')
    } else if (healthStatus.status === 'good') {
        insights.push('GOOD: Project is performing well overall')
    } else {
        insights.push('EXCELLENT: Project is exceeding expectations')
    }

    // NPV insights
    if (project.npv !== undefined && project.npv !== null) {
        if (project.npv < 0) {
            insights.push('Financial viability concern: Negative NPV indicates poor returns')
        } else if (project.npv > 0) {
            insights.push('Strong financial outlook: Positive NPV shows good returns')
        }
    }

    // Risk insights
    if (project.risk_score !== undefined && project.risk_score !== null) {
        if (project.risk_score >= 70) {
            insights.push('High risk: Implement mitigation strategies immediately')
        } else if (project.risk_score >= 40) {
            insights.push('Moderate risk: Monitor closely and address concerns')
        }
    }

    // Status insights
    if (project.status === 'Paused') {
        insights.push('Project is paused: Consider resumption plan or cancellation')
    } else if (project.status === 'Planning') {
        insights.push('Still in planning: Move to execution phase when ready')
    }

    return insights
}

// Check if project has calculator data
export function hasCalculatorData(project: Project): {
    hasNPV: boolean
    hasRisk: boolean
    hasWastage: boolean
    hasAny: boolean
    hasAll: boolean
} {
    const hasNPV = !!project.latest_npv_calculation_id
    const hasRisk = !!project.latest_risk_assessment_id
    const hasWastage = !!project.latest_wastage_assessment_id

    return {
        hasNPV,
        hasRisk,
        hasWastage,
        hasAny: hasNPV || hasRisk || hasWastage,
        hasAll: hasNPV && hasRisk && hasWastage
    }
}