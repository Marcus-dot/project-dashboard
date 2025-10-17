import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateNPV, calculateCumulativeNPV } from '@/lib/utils/calculations';

// GET: Fetch all user's NPV calculations
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('npv_calculations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching NPV calculations:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ calculations: data || [] });
    } catch (error) {
        console.error('GET /api/npv error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Save a new NPV calculation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { initial_investment, discount_rate, cash_flows, calculation_name, project_id } = body;

        // Validate inputs
        if (!initial_investment || !discount_rate || !cash_flows || !Array.isArray(cash_flows)) {
            return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
        }

        // Get user's company for currency
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
            return NextResponse.json({ error: 'User has no company' }, { status: 400 });
        }

        // Extract currency
        const companyArray = profile.companies as { currency?: string }[] | { currency?: string } | null | undefined;
        const companyData = Array.isArray(companyArray) ? companyArray[0] : companyArray;
        const currency = companyData?.currency ?? 'ZMW';

        // Calculate NPV
        const npv = calculateNPV(initial_investment, discount_rate, cash_flows);
        const isViable = npv > 0;

        // Insert into database
        const { data, error } = await supabase
            .from('npv_calculations')
            .insert({
                user_id: user.id,
                company_id: profile.company_id,
                project_id: project_id || null,
                initial_investment,
                discount_rate,
                project_duration: cash_flows.length,
                cash_flows,
                npv_result: npv,
                is_viable: isViable,
                currency,
                calculation_name: calculation_name || `NPV Calculation - ${new Date().toLocaleDateString()}`
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving NPV calculation:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ calculation: data }, { status: 201 });
    } catch (error) {
        console.error('POST /api/npv error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}