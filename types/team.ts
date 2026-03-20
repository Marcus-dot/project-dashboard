// ─────────────────────────────────────────
// Dashly Role System
// ─────────────────────────────────────────

export type DashlyRole = 'DASHMASTER' | 'DASHKEEPER' | 'OBSERVER'

export type InvitationStatus = 'pending' | 'accepted' | 'expired'

// ─────────────────────────────────────────
// Team Member — profile shaped for team UI
// ─────────────────────────────────────────

export interface TeamMember {
    id: string
    email: string
    full_name: string | null
    dashly_role: DashlyRole
    industry: string | null
    company_id: string
    created_at: string
    updated_at: string
}

// ─────────────────────────────────────────
// Invitation
// ─────────────────────────────────────────

export interface Invitation {
    id: string
    company_id: string
    invited_by: string | null
    email: string
    dashly_role: DashlyRole
    token: string
    status: InvitationStatus
    expires_at: string
    accepted_at: string | null
    created_at: string
}

// Used when creating a new invitation
export interface CreateInvitationPayload {
    email: string
    dashly_role: DashlyRole
}

// What the acceptance page receives after validating a token
export interface InvitationValidation {
    valid: boolean
    invitation: Invitation | null
    company_name: string | null
    error?: string
}

// ─────────────────────────────────────────
// Role metadata — labels, descriptions, colours
// ─────────────────────────────────────────

export const DASHLY_ROLES: {
    value: DashlyRole
    label: string
    description: string
    color: string
}[] = [
        {
            value: 'DASHMASTER',
            label: 'Dashmaster',
            description: 'Full admin access. Max 2 per company.',
            color: '#6E3482',
        },
        {
            value: 'DASHKEEPER',
            label: 'Dashkeeper',
            description: 'Can manage projects and invite team members.',
            color: '#A56ABD',
        },
        {
            value: 'OBSERVER',
            label: 'Observer',
            description: 'Read-only access to all projects.',
            color: '#A9899A',
        },
    ]

// ─────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────

export const canInviteMembers = (role: DashlyRole): boolean =>
    role === 'DASHMASTER' || role === 'DASHKEEPER'

export const canManageProjects = (role: DashlyRole): boolean =>
    role === 'DASHMASTER' || role === 'DASHKEEPER'

export const canAccessAdmin = (role: DashlyRole): boolean =>
    role === 'DASHMASTER'

export const isReadOnly = (role: DashlyRole): boolean =>
    role === 'OBSERVER'