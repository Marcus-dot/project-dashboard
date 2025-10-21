import type { WastageAssessment, WastageAssessmentInput } from '@/types/wastage'

/**
 * CLIENT-SIDE Wastage service that calls API routes
 * Use this in 'use client' components
 */

export async function saveWastageAssessment(input: WastageAssessmentInput): Promise<WastageAssessment | null> {
    try {
        const response = await fetch('/api/wastage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('Error saving wastage assessment:', error)
            return null
        }

        const { assessment } = await response.json()
        return assessment
    } catch (error) {
        console.error('saveWastageAssessment error:', error)
        return null
    }
}

export async function getUserWastageAssessments(): Promise<WastageAssessment[]> {
    try {
        const response = await fetch('/api/wastage', {
            method: 'GET',
            cache: 'no-store' // Always fetch fresh data
        })

        if (!response.ok) {
            console.error('Error fetching wastage assessments')
            return []
        }

        const { assessments } = await response.json()
        return assessments
    } catch (error) {
        console.error('getUserWastageAssessments error:', error)
        return []
    }
}

export async function deleteWastageAssessment(id: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/wastage/${id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            console.error('Error deleting wastage assessment')
            return false
        }

        return true
    } catch (error) {
        console.error('deleteWastageAssessment error:', error)
        return false
    }
}

// NEW: Link Wastage assessment to project
export async function linkWastageToProject(assessmentId: string, projectId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/wastage/link-to-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessment_id: assessmentId, project_id: projectId })
        })

        if (!response.ok) {
            console.error('Error linking wastage assessment to project')
            return false
        }

        return true
    } catch (error) {
        console.error('linkWastageToProject error:', error)
        return false
    }
}