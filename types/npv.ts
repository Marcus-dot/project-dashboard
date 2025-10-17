// NPV Calculation Types
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
    calculation_name?: string;
    notes?: string;
}

export interface NPVResult {
    npv: number;
    isViable: boolean;
    cumulativeValues: Array<{ year: number; value: number }>;
    breakEvenYear?: number; // Year when cumulative NPV turns positive
}