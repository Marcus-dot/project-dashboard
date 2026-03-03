import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Link NPV calculation to a project
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { calculation_id, project_id } = body

        if (!calculation_id || !project_id) {
            return NextResponse.json(
                { error: 'Missing calculation_id or project_id' },
                { status: 400 }
            )
        }

        // Verify calculation belongs to user
        const { data: calculation, error: calcError } = await supabase
            .from('npv_calculations')
            .select('id, npv_result')
            .eq('id', calculation_id)
            .eq('user_id', user.id)
            .single()

        if (calcError || !calculation) {
            return NextResponse.json({ error: 'Calculation not found' }, { status: 404 })
        }

        // Verify project belongs to user
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', project_id)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Update project with latest NPV calculation and NPV value
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                latest_npv_calculation_id: calculation_id,
                npv: calculation.npv_result
            })
            .eq('id', project_id)

        if (updateError) {
            console.error('Error linking NPV to project:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Update NPV calculation with project_id
        await supabase
            .from('npv_calculations')
            .update({ project_id })
            .eq('id', calculation_id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('POST /api/npv/link-to-project error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}