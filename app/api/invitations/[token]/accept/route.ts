// POST /api/invitations/[token]/accept
// Called when a user clicks "Accept" on the invitation page
// Updates their profile with the company + role from the invitation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Must be logged in to accept
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'You must be logged in to accept an invitation' },
                { status: 401 }
            )
        }

        // Look up the invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single()

        if (inviteError || !invitation) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            )
        }

        // Guard: already accepted
        if (invitation.status === 'accepted') {
            return NextResponse.json(
                { error: 'This invitation has already been accepted' },
                { status: 410 }
            )
        }

        // Guard: expired
        const isExpired =
            invitation.status === 'expired' ||
            new Date(invitation.expires_at) < new Date()

        if (isExpired) {
            await supabase
                .from('invitations')
                .update({ status: 'expired' })
                .eq('id', invitation.id)

            return NextResponse.json(
                { error: 'This invitation has expired' },
                { status: 410 }
            )
        }

        // Guard: email mismatch
        if (user.email !== invitation.email) {
            return NextResponse.json(
                {
                    error: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
                },
                { status: 403 }
            )
        }

        // Guard: user already belongs to a company
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (existingProfile?.company_id) {
            return NextResponse.json(
                { error: 'You already belong to a company workspace' },
                { status: 409 }
            )
        }

        // Guard: DASHMASTER cap
        if (invitation.dashly_role === 'DASHMASTER') {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', invitation.company_id)
                .eq('dashly_role', 'DASHMASTER')

            if ((count ?? 0) >= 2) {
                return NextResponse.json(
                    { error: 'This company already has the maximum number of Dashmasters' },
                    { status: 400 }
                )
            }
        }

        // Update the user's profile — join the company with the invited role
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                company_id: invitation.company_id,
                dashly_role: invitation.dashly_role,
            })
            .eq('id', user.id)

        if (profileError) {
            console.error('[accept] profile update error', profileError)
            return NextResponse.json(
                { error: 'Failed to update your profile' },
                { status: 500 }
            )
        }

        // Mark invitation as accepted
        const { error: updateError } = await supabase
            .from('invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation.id)

        if (updateError) {
            console.error('[accept] invitation update error', updateError)
            // Profile was updated — don't fail, just log
        }

        return NextResponse.json({
            success: true,
            company_id: invitation.company_id,
            dashly_role: invitation.dashly_role,
        })
    } catch (err) {
        console.error('[POST /api/invitations/[token]/accept]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}