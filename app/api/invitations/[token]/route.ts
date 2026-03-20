// GET /api/invitations/[token]
// Validates a token and returns invitation + company details
// Used by the acceptance page to show what the user is accepting

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Look up the invitation by token
        const { data: invitation, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !invitation) {
            return NextResponse.json(
                { valid: false, error: 'Invitation not found' },
                { status: 404 }
            )
        }

        // Check if already accepted
        if (invitation.status === 'accepted') {
            return NextResponse.json(
                { valid: false, error: 'This invitation has already been accepted' },
                { status: 410 }
            )
        }

        // Check if expired (by status or by date)
        const isExpired =
            invitation.status === 'expired' ||
            new Date(invitation.expires_at) < new Date()

        if (isExpired) {
            // Mark as expired in DB if not already
            if (invitation.status === 'pending') {
                await supabase
                    .from('invitations')
                    .update({ status: 'expired' })
                    .eq('id', invitation.id)
            }

            return NextResponse.json(
                { valid: false, error: 'This invitation has expired' },
                { status: 410 }
            )
        }

        // Get company name to display on acceptance page
        const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', invitation.company_id)
            .single()

        return NextResponse.json({
            valid: true,
            invitation,
            company_name: company?.name ?? null,
        })
    } catch (err) {
        console.error('[GET /api/invitations/[token]]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}