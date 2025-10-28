import { createClient } from '@/lib/supabase/server';
import { calculateNPV, calculateCumulativeNPV } from '@/lib/utils/calculations';
import type { NPVCalculation, NPVCalculationInput, NPVResult } from '@/types/npv';

/**
 * Calculate NPV and return detailed results
 */
export async function performNPVCalculation(
    initialInvestment: number,
    discountRate: number,
    cashFlows: number[]
): Promise<NPVResult> {
    const npv = calculateNPV(initialInvestment, discountRate, cashFlows);
    const cumulativeValues = calculateCumulativeNPV(initialInvestment, discountRate, cashFlows);

    // Find break-even period (when cumulative NPV becomes positive)
    const breakEvenPeriod = cumulativeValues.findIndex(point => point.value > 0);

    return {
        npv,
        isViable: npv > 0,
        cumulativeValues,
        breakEvenPeriod: breakEvenPeriod !== -1 ? breakEvenPeriod : undefined  // ✅ FIXED: Changed from breakEvenYear to breakEvenPeriod
    };
}

/**
 * Save NPV calculation to database
 */
export async function saveNPVCalculation(
    input: NPVCalculationInput
): Promise<NPVCalculation | null> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Error getting user:', userError);
        return null;
    }

    // Get user's company for currency - FIXED QUERY
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
      company_id,
      companies:company_id (
        currency
      )
    `)
        .eq('user_id', user.id)
        .single();

    if (!profile?.company_id) {
        console.error('User has no company');
        return null;
    }

    // Extract currency correctly - FIX HERE
    const companyArray = profile.companies as { currency?: string }[] | { currency?: string } | null | undefined;
    const companyData = Array.isArray(companyArray) ? companyArray[0] : companyArray;
    const currency = companyData?.currency ?? 'ZMW';

    // Calculate NPV
    const result = await performNPVCalculation(
        input.initial_investment,
        input.discount_rate,
        input.cash_flows
    );

    // Insert into database
    const { data, error } = await supabase
        .from('npv_calculations')
        .insert({
            user_id: user.id,
            company_id: profile.company_id,
            project_id: input.project_id || null,
            initial_investment: input.initial_investment,
            discount_rate: input.discount_rate,
            project_duration: input.cash_flows.length,
            cash_flows: input.cash_flows,
            npv_result: result.npv,
            is_viable: result.isViable,
            currency,
            calculation_name: input.calculation_name,
            notes: input.notes
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving NPV calculation:', error);
        return null;
    }

    return data;
}

/**
 * Get all NPV calculations for current user
 */
export async function getUserNPVCalculations(): Promise<NPVCalculation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('npv_calculations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching NPV calculations:', error);
        return [];
    }

    return data || [];
}

/**
 * Get NPV calculation by ID
 */
export async function getNPVCalculationById(id: string): Promise<NPVCalculation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('npv_calculations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching NPV calculation:', error);
        return null;
    }

    return data;
}

/**
 * Delete NPV calculation
 */
export async function deleteNPVCalculation(id: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('npv_calculations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting NPV calculation:', error);
        return false;
    }

    return true;
}