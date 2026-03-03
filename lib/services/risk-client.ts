import type { RiskAssessment, RiskAssessmentInput } from '@/types/risk';

/**
 * CLIENT-SIDE Risk service that calls API routes
 * Use this in 'use client' components
 */

export async function saveRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessment | null> {
    try {
        const response = await fetch('/api/risk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error saving risk assessment:', error);
            return null;
        }

        const { assessment } = await response.json();
        return assessment;
    } catch (error) {
        console.error('saveRiskAssessment error:', error);
        return null;
    }
}

export async function getUserRiskAssessments(): Promise<RiskAssessment[]> {
    try {
        const response = await fetch('/api/risk', {
            method: 'GET',
            cache: 'no-store' // Always fetch fresh data
        });

        if (!response.ok) {
            console.error('Error fetching risk assessments');
            return [];
        }

        const { assessments } = await response.json();
        return assessments;
    } catch (error) {
        console.error('getUserRiskAssessments error:', error);
        return [];
    }
}

export async function deleteRiskAssessment(id: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/risk/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Error deleting risk assessment');
            return false;
        }

        return true;
    } catch (error) {
        console.error('deleteRiskAssessment error:', error);
        return false;
    }
}

// NEW: Link Risk assessment to project
export async function linkRiskToProject(assessmentId: string, projectId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/risk/link-to-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessment_id: assessmentId, project_id: projectId })
        });

        if (!response.ok) {
            console.error('Error linking risk assessment to project');
            return false;
        }

        return true;
    } catch (error) {
        console.error('linkRiskToProject error:', error);
        return false;
    }
}