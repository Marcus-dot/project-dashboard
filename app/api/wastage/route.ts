import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateWastageMetrics } from '@/types/wastage'

// GET: Fetch all user's wastage assessments
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('wastage_assessments')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching wastage assessments:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ assessments: data || [] })
    } catch (error) {
        console.error('GET /api/wastage error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST: Save a new wastage assessment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            resource_type,
            allocated,
            used,
            unit,
            cost_per_unit,
            assessment_name,
            notes,
            project_id
        } = body

        // Validate required fields
        if (!resource_type || allocated === undefined || used === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: resource_type, allocated, used' },
                { status: 400 }
            )
        }

        // Validate numeric values
        if (allocated < 0 || used < 0) {
            return NextResponse.json(
                { error: 'Allocated and used values must be non-negative' },
                { status: 400 }
            )
        }

        // Get user's profile (for company_id)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Profile error:', profileError)
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
        }

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'User has no company' }, { status: 400 })
        }

        // Calculate metrics
        const metrics = calculateWastageMetrics(allocated, used, cost_per_unit)

        // Insert into database
        const { data, error } = await supabase
            .from('wastage_assessments')
            .insert({
                user_id: user.id,
                company_id: profile.company_id,
                project_id: project_id || null,
                resource_type,
                allocated,
                used,
                unit: unit || null,
                wastage_amount: metrics.wastage_amount,
                wastage_percentage: metrics.wastage_percentage,
                efficiency_score: metrics.efficiency_score,
                cost_per_unit: cost_per_unit || null,
                wastage_cost: metrics.wastage_cost || null,
                assessment_name: assessment_name || `${resource_type} Assessment - ${new Date().toLocaleDateString()}`,
                notes: notes || null
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving wastage assessment:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ assessment: data }, { status: 201 })
    } catch (error) {
        console.error('POST /api/wastage error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}