import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRiskScore } from '@/lib/utils/calculations';
import { getRiskLevelFromScore } from '@/types/risk';

// GET: Fetch all user's risk assessments
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('risk_assessments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching risk assessments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ assessments: data || [] });
    } catch (error) {
        console.error('GET /api/risk error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Save a new risk assessment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            budget_variance,
            schedule_delay,
            resource_availability,
            complexity,
            stakeholder_alignment,
            assessment_name,
            notes,
            project_id
        } = body;

        // Validate that at least one factor is provided
        const factors = {
            budgetVariance: budget_variance,
            scheduleDelay: schedule_delay,
            resourceAvailability: resource_availability,
            complexity: complexity,
            stakeholderAlignment: stakeholder_alignment
        };

        const hasAnyFactor = Object.values(factors).some(val => val !== undefined && val !== null);
        if (!hasAnyFactor) {
            return NextResponse.json({ error: 'At least one risk factor is required' }, { status: 400 });
        }

        // Get user's profile (simplified - just company_id)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
        }

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'User has no company' }, { status: 400 });
        }

        // Calculate risk score
        const riskScore = calculateRiskScore(factors);
        const { level: riskLevel } = getRiskLevelFromScore(riskScore);

        // Insert into database
        const { data, error } = await supabase
            .from('risk_assessments')
            .insert({
                user_id: user.id,
                company_id: profile.company_id,
                project_id: project_id || null,
                budget_variance: budget_variance ?? null,
                schedule_delay: schedule_delay ?? null,
                resource_availability: resource_availability ?? null,
                complexity: complexity ?? null,
                stakeholder_alignment: stakeholder_alignment ?? null,
                risk_score: riskScore,
                risk_level: riskLevel,
                assessment_name: assessment_name || `Risk Assessment - ${new Date().toLocaleDateString()}`,
                notes: notes || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving risk assessment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ assessment: data }, { status: 201 });
    } catch (error) {
        console.error('POST /api/risk error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}