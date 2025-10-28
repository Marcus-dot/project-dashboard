import type { NPVCalculation, PeriodType } from '@/types/npv';

/**
 * CLIENT-SIDE NPV service that calls API routes
 * Use this in 'use client' components
 */

export async function saveNPVCalculation(input: {
    initial_investment: number;
    discount_rate: number;
    cash_flows: number[];
    period_type?: PeriodType; // NEW: Period type support
    calculation_name?: string;
    project_id?: string;
}): Promise<NPVCalculation | null> {
    try {
        const response = await fetch('/api/npv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error saving NPV calculation:', error);
            return null;
        }

        const { calculation } = await response.json();
        return calculation;
    } catch (error) {
        console.error('saveNPVCalculation error:', error);
        return null;
    }
}

export async function getUserNPVCalculations(): Promise<NPVCalculation[]> {
    try {
        const response = await fetch('/api/npv', {
            method: 'GET',
            cache: 'no-store' // Always fetch fresh data
        });

        if (!response.ok) {
            console.error('Error fetching NPV calculations');
            return [];
        }

        const { calculations } = await response.json();
        return calculations;
    } catch (error) {
        console.error('getUserNPVCalculations error:', error);
        return [];
    }
}

export async function deleteNPVCalculation(id: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/npv/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Error deleting NPV calculation');
            return false;
        }

        return true;
    } catch (error) {
        console.error('deleteNPVCalculation error:', error);
        return false;
    }
}

// Link NPV calculation to project
export async function linkNPVToProject(calculationId: string, projectId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/npv/link-to-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calculation_id: calculationId, project_id: projectId })
        });

        if (!response.ok) {
            console.error('Error linking NPV to project');
            return false;
        }

        return true;
    } catch (error) {
        console.error('linkNPVToProject error:', error);
        return false;
    }
}