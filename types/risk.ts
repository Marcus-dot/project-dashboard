// Risk Assessment Types
export interface RiskAssessment {
    id: string;
    user_id: string;
    project_id: string | null;
    company_id: string;

    // Risk Factors (0-100 scale)
    budget_variance: number | null;
    schedule_delay: number | null;
    resource_availability: number | null;
    complexity: number | null;
    stakeholder_alignment: number | null;

    // Results
    risk_score: number;
    risk_level: RiskLevel;

    // Metadata
    assessment_name: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface RiskAssessmentInput {
    project_id?: string;
    budget_variance?: number;
    schedule_delay?: number;
    resource_availability?: number;
    complexity?: number;
    stakeholder_alignment?: number;
    assessment_name?: string;
    notes?: string;
}

export interface RiskResult {
    risk_score: number;
    risk_level: RiskLevel;
    color: string;
    recommendations: string[];
}

export interface RiskFactor {
    name: string;
    value: number;
    weight: number;
    description: string;
    color: string;
}

// Risk factor weights (must sum to 1.0)
export const RISK_WEIGHTS = {
    budgetVariance: 0.25,      // 25%
    scheduleDelay: 0.20,       // 20%
    resourceAvailability: 0.20, // 20%
    complexity: 0.20,          // 20%
    stakeholderAlignment: 0.15  // 15%
} as const;

// Risk level thresholds
export const RISK_THRESHOLDS = {
    low: { min: 0, max: 39, label: 'Low Risk', color: '#10b981' },      // Green
    medium: { min: 40, max: 69, label: 'Medium Risk', color: '#f59e0b' }, // Orange
    high: { min: 70, max: 100, label: 'High Risk', color: '#ef4444' }    // Red
} as const;

// Risk factor definitions
export const RISK_FACTORS: Record<string, { label: string; description: string; color: string }> = {
    budgetVariance: {
        label: 'Budget Variance',
        description: 'How much the project is over/under budget',
        color: '#3b82f6' // Blue
    },
    scheduleDelay: {
        label: 'Schedule Delay',
        description: 'Project timeline slippage and delays',
        color: '#8b5cf6' // Purple
    },
    resourceAvailability: {
        label: 'Resource Availability',
        description: 'Team capacity and resource constraints',
        color: '#ec4899' // Pink
    },
    complexity: {
        label: 'Complexity',
        description: 'Technical and operational difficulty',
        color: '#f59e0b' // Orange
    },
    stakeholderAlignment: {
        label: 'Stakeholder Alignment',
        description: 'Buy-in and support from key stakeholders',
        color: '#06b6d4' // Cyan
    }
} as const;

// Recommendations based on risk score
export function getRiskRecommendations(score: number, factors: RiskAssessmentInput): string[] {
    const recommendations: string[] = [];

    // Budget variance recommendations
    if (factors.budget_variance && factors.budget_variance >= 60) {
        recommendations.push('Implement stricter budget controls and monthly reviews');
        recommendations.push('Consider revising project scope to reduce costs');
    }

    // Schedule delay recommendations
    if (factors.schedule_delay && factors.schedule_delay >= 60) {
        recommendations.push('Add buffer time to critical path activities');
        recommendations.push('Increase team resources to accelerate delivery');
    }

    // Resource availability recommendations
    if (factors.resource_availability && factors.resource_availability >= 60) {
        recommendations.push('Secure additional resources or contractors');
        recommendations.push('Prioritize tasks and reduce scope if necessary');
    }

    // Complexity recommendations
    if (factors.complexity && factors.complexity >= 60) {
        recommendations.push('Break down complex tasks into smaller milestones');
        recommendations.push('Bring in specialized expertise or consultants');
    }

    // Stakeholder alignment recommendations
    if (factors.stakeholder_alignment && factors.stakeholder_alignment >= 60) {
        recommendations.push('Schedule stakeholder alignment meetings');
        recommendations.push('Improve communication and transparency');
    }

    // Overall score recommendations
    if (score >= 70) {
        recommendations.push('🚨 High risk project - consider pausing for risk mitigation');
        recommendations.push('Escalate to senior management for review');
    } else if (score >= 40) {
        recommendations.push('⚠️ Monitor closely and implement mitigation strategies');
    } else {
        recommendations.push('✅ Low risk - maintain current approach');
    }

    return recommendations;
}

// Get risk level from score
export function getRiskLevelFromScore(score: number): { level: RiskLevel; color: string } {
    if (score >= RISK_THRESHOLDS.high.min) {
        return { level: RISK_THRESHOLDS.high.label, color: RISK_THRESHOLDS.high.color };
    } else if (score >= RISK_THRESHOLDS.medium.min) {
        return { level: RISK_THRESHOLDS.medium.label, color: RISK_THRESHOLDS.medium.color };
    } else {
        return { level: RISK_THRESHOLDS.low.label, color: RISK_THRESHOLDS.low.color };
    }
}