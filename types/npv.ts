// NPV Calculation Types

// Period type for cash flows
export type PeriodType = 'years' | 'quarters' | 'months' | 'weeks';

// Period configuration
export const PERIOD_CONFIGS = {
    years: {
        label: 'Years',
        singular: 'Year',
        periodsPerYear: 1,
        shortLabel: 'Y'
    },
    quarters: {
        label: 'Quarters',
        singular: 'Quarter',
        periodsPerYear: 4,
        shortLabel: 'Q'
    },
    months: {
        label: 'Months',
        singular: 'Month',
        periodsPerYear: 12,
        shortLabel: 'M'
    },
    weeks: {
        label: 'Weeks',
        singular: 'Week',
        periodsPerYear: 52,
        shortLabel: 'W'
    }
} as const;

export interface NPVCalculation {
    id: string;
    user_id: string;
    project_id: string | null;
    company_id: string;

    // Parameters
    initial_investment: number;
    discount_rate: number;
    project_duration: number;
    cash_flows: number[];
    period_type: PeriodType; // NEW: Type of period used

    // Results
    npv_result: number;
    is_viable: boolean;
    currency: string;

    // Metadata
    calculation_name?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface NPVCalculationInput {
    project_id?: string;
    initial_investment: number;
    discount_rate: number;
    cash_flows: number[];
    period_type?: PeriodType; // NEW: Type of period used (default: 'years')
    calculation_name?: string;
    notes?: string;
}

export interface NPVResult {
    npv: number;
    isViable: boolean;
    cumulativeValues: Array<{ period: number; value: number }>; // Changed 'year' to 'period'
    breakEvenPeriod?: number; // Changed from 'breakEvenYear' to 'breakEvenPeriod'
}

// Helper function to get period label
export function getPeriodLabel(periodType: PeriodType, periodNumber: number): string {
    const config = PERIOD_CONFIGS[periodType];

    if (periodType === 'quarters') {
        return `Q${periodNumber}`;
    }

    return `${config.singular} ${periodNumber}`;
}

// Helper function to convert periods to years for discount calculation
export function periodsToYears(periods: number, periodType: PeriodType): number {
    const config = PERIOD_CONFIGS[periodType];
    return periods / config.periodsPerYear;
}