import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Link Risk assessment to a project
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { assessment_id, project_id } = body

        if (!assessment_id || !project_id) {
            return NextResponse.json(
                { error: 'Missing assessment_id or project_id' },
                { status: 400 }
            )
        }

        // Verify assessment belongs to user
        const { data: assessment, error: assessError } = await supabase
            .from('risk_assessments')
            .select('id, risk_score')
            .eq('id', assessment_id)
            .eq('user_id', user.id)
            .single()

        if (assessError || !assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
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

        // Update project with latest risk assessment and risk score
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                latest_risk_assessment_id: assessment_id,
                risk_score: assessment.risk_score
            })
            .eq('id', project_id)

        if (updateError) {
            console.error('Error linking risk to project:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Update risk assessment with project_id
        await supabase
            .from('risk_assessments')
            .update({ project_id })
            .eq('id', assessment_id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('POST /api/risk/link-to-project error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}